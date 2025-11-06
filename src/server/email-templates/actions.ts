"use server";

import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ensureAdmin = async () => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in.");
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    throw new Error("Only administrators can perform this action.");
  }

  return {
    supabaseAdmin,
    userId: user.id
  };
};

const createEmailTemplateSchema = z.object({
  templateName: z
    .string()
    .trim()
    .min(3, "Template name must be at least 3 characters.")
    .max(120, "Template name must be 120 characters or fewer."),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters.")
    .max(200, "Subject must be 200 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(1, "Email body cannot be empty.")
});

const templateIdSchema = z
  .string()
  .trim()
  .min(1, "Email template is required.")
  .uuid("Invalid email template.");

const htmlToPlainText = (html: string): string =>
  html
    .replace(/<\/?(p|div|section|h[1-6])>/gi, "\n\n")
    .replace(/<li>\s*/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export type EmailTemplateSummary = {
  id: string;
  templateName: string;
  subject: string;
  bodyHtml: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateEmailTemplateState = {
  success: boolean;
  error?: string;
  template?: EmailTemplateSummary;
};

export const createEmailTemplateAction = async (
  _prev: CreateEmailTemplateState,
  formData: FormData
): Promise<CreateEmailTemplateState> => {
  const templateIdValue = formData.get("templateId");
  const templateId =
    typeof templateIdValue === "string" && templateIdValue.trim().length > 0
      ? templateIdValue.trim()
      : null;

  if (templateId) {
    const parsedId = templateIdSchema.safeParse(templateId);
    if (!parsedId.success) {
      const issue = parsedId.error.issues[0];
      return {
        success: false,
        error:
          issue?.message ?? "Unable to identify the email template to update."
      };
    }
  }

  const parsed = createEmailTemplateSchema.safeParse({
    templateName: formData.get("templateName"),
    subject: formData.get("subject"),
    body: formData.get("body")
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      success: false,
      error: issue?.message ?? "Invalid form submission."
    };
  }

  const { templateName, subject, body } = parsed.data;
  const plainText = htmlToPlainText(body);

  try {
    const { supabaseAdmin, userId } = await ensureAdmin();

    if (templateId) {
      const { data, error } = await supabaseAdmin
        .from("email_templates")
        .update({
          template_name: templateName,
          subject,
          body_html: body,
          body_text: plainText
        })
        .eq("id", templateId)
        .select("id, template_name, subject, body_html, created_at, updated_at")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return {
          success: false,
          error: "Email template not found."
        };
      }

      return {
        success: true,
        template: {
          id: data.id,
          templateName: data.template_name,
          subject: data.subject,
          bodyHtml: data.body_html,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      };
    }

    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .insert({
        template_name: templateName,
        subject,
        body_html: body,
        body_text: plainText,
        created_by: userId
      })
      .select("id, template_name, subject, body_html, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      template: {
        id: data.id,
        templateName: data.template_name,
        subject: data.subject,
        bodyHtml: data.body_html,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    };
  } catch (error) {
    console.error("[email-template] create failed", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to save email template. Try again later.";

    return {
      success: false,
      error: message
    };
  }
};

export type DeleteEmailTemplateState = {
  success: boolean;
  error?: string;
};

export const deleteEmailTemplateAction = async (
  templateId: string
): Promise<DeleteEmailTemplateState> => {
  const parsedId = templateIdSchema.safeParse(templateId);

  if (!parsedId.success) {
    const issue = parsedId.error.issues[0];
    return {
      success: false,
      error: issue?.message ?? "Invalid email template."
    };
  }

  try {
    const { supabaseAdmin } = await ensureAdmin();

    const { error } = await supabaseAdmin
      .from("email_templates")
      .delete()
      .eq("id", parsedId.data);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("[email-template] delete failed", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete email template. Try again later.";

    return {
      success: false,
      error: message
    };
  }
};
