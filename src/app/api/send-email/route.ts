import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  sendWorkspaceEmail,
  type WorkspaceEmailRecord
} from "@/server/workspace-emails/gmail";

const sendEmailSchema = z
  .object({
    leadId: z.string().uuid(),
    subject: z
      .string()
      .trim()
      .min(1, "Subject is required.")
      .max(998, "Subject is too long."),
    textBody: z.string().optional(),
    htmlBody: z.string().optional(),
    cc: z.array(z.string().email("Invalid CC email address.")).optional(),
    bcc: z.array(z.string().email("Invalid BCC email address.")).optional(),
    replyTo: z.string().email("Invalid reply-to address.").optional(),
    workspaceEmailId: z.string().uuid().optional()
  })
  .superRefine((value, ctx) => {
    if (!value.textBody && !value.htmlBody) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either textBody or htmlBody for the email content."
      });
    }
  });

const unauthorized = () =>
  NextResponse.json({ message: "Unauthorized" }, { status: 401 });

const badRequest = (message: string, issues?: unknown) =>
  NextResponse.json({ message, issues }, { status: 400 });

const notFound = (message: string) =>
  NextResponse.json({ message }, { status: 404 });

const forbidden = (message: string) =>
  NextResponse.json({ message }, { status: 403 });

const serverError = () =>
  NextResponse.json(
    { message: "Unable to send email right now." },
    { status: 500 }
  );

export const POST = async (request: Request) => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  let jsonBody: unknown;

  try {
    jsonBody = await request.json();
  } catch (error) {
    return badRequest("Invalid JSON payload.");
  }

  const parsed = sendEmailSchema.safeParse(jsonBody);

  if (!parsed.success) {
    return badRequest(
      "Invalid email payload.",
      parsed.error.flatten().fieldErrors ?? parsed.error.flatten()
    );
  }

  const payload = parsed.data;

  const supabaseAdmin = getSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, workspace_email_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[send-email] profile lookup failed", profileError);
    return serverError();
  }

  const { data: lead, error: leadError } = await supabaseAdmin
    .from("leads")
    .select("id, email, name")
    .eq("id", payload.leadId)
    .maybeSingle();

  if (leadError) {
    console.error("[send-email] lead lookup failed", leadError);
    return serverError();
  }

  if (!lead) {
    return notFound("Lead not found.");
  }

  if (!lead.email) {
    return badRequest("Lead does not have an email address.");
  }

  const resolvedWorkspaceEmailId =
    payload.workspaceEmailId ?? profile.workspace_email_id;

  if (!resolvedWorkspaceEmailId) {
    return badRequest(
      "No workspace email assigned. Please contact an administrator."
    );
  }

  if (
    profile.role === "team" &&
    payload.workspaceEmailId &&
    payload.workspaceEmailId !== profile.workspace_email_id
  ) {
    return forbidden(
      "You can only send email from your assigned workspace mailbox."
    );
  }

  const { data: workspaceEmail, error: workspaceError } = await supabaseAdmin
    .from("workspace_emails")
    .select(
      "id, email, display_name, access_token, refresh_token, token_expires_at, token_scope, token_type, is_active"
    )
    .eq("id", resolvedWorkspaceEmailId)
    .maybeSingle();

  if (workspaceError) {
    console.error("[send-email] workspace lookup failed", workspaceError);
    return serverError();
  }

  if (!workspaceEmail || !workspaceEmail.is_active) {
    return badRequest(
      "The selected workspace email is unavailable. Please contact an administrator."
    );
  }

  if (!workspaceEmail.refresh_token) {
    console.error(
      "[send-email] workspace missing refresh token",
      workspaceEmail.id
    );
    return serverError();
  }

  try {
    const gmailResponse = await sendWorkspaceEmail({
      workspace: workspaceEmail as WorkspaceEmailRecord,
      to: lead.email,
      subject: payload.subject,
      text: payload.textBody,
      html: payload.htmlBody,
      cc: payload.cc,
      bcc: payload.bcc
    });

    const eventPayload = {
      leadId: lead.id,
      subject: payload.subject,
      to: lead.email,
      cc: payload.cc ?? [],
      bcc: payload.bcc ?? [],
      workspaceEmailId: workspaceEmail.id,
      gmailMessageId: gmailResponse.id ?? null,
      textBody: payload.textBody ?? null,
      htmlBody: payload.htmlBody ?? null,
      sentAt: new Date().toISOString()
    };

    const { error: eventError } = await supabaseAdmin
      .from("lead_events")
      .insert({
        lead_id: lead.id,
        actor_id: user.id,
        workspace_email_id: workspaceEmail.id,
        event_type: "email_sent",
        payload: eventPayload
      });

    if (eventError) {
      console.error("[send-email] lead event insert failed", eventError);
    }
    // update the lead's status as email-sent
    const { error: leadUpdateError } = await supabaseAdmin
      .from("leads")
      .update({ status: "email-send" })
      .eq("id", lead.id);

    if (leadUpdateError) {
      console.error("[send-email] lead status update failed", leadUpdateError);
    }

    return NextResponse.json(
      {
        success: true,
        messageId: gmailResponse.id ?? null,
        threadId: gmailResponse.threadId ?? null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[send-email] failed to send Gmail message", error);
    return serverError();
  }
};
