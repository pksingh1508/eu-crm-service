"use server";

import type { gmail_v1 } from "googleapis";

import { getGmailClientFromTokens, refreshOAuthTokens } from "@/lib/google";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type WorkspaceEmailRecord = {
  id: string;
  email: string;
  display_name: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  token_scope: string | null;
  token_type: string | null;
};

type WorkspaceEmailWithClient = {
  workspaceEmail: WorkspaceEmailRecord;
  gmail: gmail_v1.Gmail;
  accessToken: string;
  refreshToken: string;
  expiryDate: number | null;
};

const shouldRefreshToken = (expiresAt: string | null) => {
  if (!expiresAt) {
    return true;
  }
  const bufferMs = 60_000;
  return Date.parse(expiresAt) - bufferMs < Date.now();
};

const updateWorkspaceTokens = async (
  workspaceEmailId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number | null;
    scope?: string;
    tokenType?: string;
  }
) => {
  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from("workspace_emails")
    .update({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_expires_at: tokens.expiryDate
        ? new Date(tokens.expiryDate).toISOString()
        : null,
      token_scope: tokens.scope ?? null,
      token_type: tokens.tokenType ?? null
    })
    .eq("id", workspaceEmailId);

  if (error) {
    console.error(
      "[workspace-email] failed to persist refreshed tokens",
      error
    );
  }
};

export const getWorkspaceGmailClient = async (
  workspace: WorkspaceEmailRecord
): Promise<WorkspaceEmailWithClient> => {
  if (!workspace.refresh_token) {
    throw new Error("Workspace email does not have a refresh token.");
  }

  if (
    !workspace.access_token ||
    shouldRefreshToken(workspace.token_expires_at)
  ) {
    const refreshed = await refreshOAuthTokens(workspace.refresh_token);
    await updateWorkspaceTokens(workspace.id, refreshed);

    const gmail = getGmailClientFromTokens({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiryDate: refreshed.expiryDate
    });
    return {
      workspaceEmail: {
        ...workspace,
        access_token: refreshed.accessToken,
        refresh_token: refreshed.refreshToken,
        token_expires_at: refreshed.expiryDate
          ? new Date(refreshed.expiryDate).toISOString()
          : null,
        token_scope: refreshed.scope ?? null,
        token_type: refreshed.tokenType ?? null
      },
      gmail,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiryDate: refreshed.expiryDate ?? null
    };
  }

  const gmail = getGmailClientFromTokens({
    accessToken: workspace.access_token,
    refreshToken: workspace.refresh_token,
    expiryDate: workspace.token_expires_at
      ? Date.parse(workspace.token_expires_at)
      : null
  });

  return {
    workspaceEmail: workspace,
    gmail,
    accessToken: workspace.access_token,
    refreshToken: workspace.refresh_token,
    expiryDate: workspace.token_expires_at
      ? Date.parse(workspace.token_expires_at)
      : null
  };
};

const toBase64Url = (input: string) =>
  Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

type BuildMimeParams = {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
};

const buildMimeMessage = ({
  from,
  to,
  subject,
  text,
  html,
  cc,
  bcc,
  replyTo
}: BuildMimeParams) => {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    cc && cc.length > 0 ? `Cc: ${cc.join(", ")}` : null,
    bcc && bcc.length > 0 ? `Bcc: ${bcc.join(", ")}` : null,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${subject}`,
    "MIME-Version: 1.0"
  ].filter(Boolean) as string[];

  if (html) {
    headers.push('Content-Type: text/html; charset="UTF-8"');
    return toBase64Url(`${headers.join("\r\n")}\r\n\r\n${html}`);
  }

  headers.push('Content-Type: text/plain; charset="UTF-8"');
  const body = text ?? "";
  return toBase64Url(`${headers.join("\r\n")}\r\n\r\n${body}`);
};

type SendWorkspaceEmailParams = {
  workspace: WorkspaceEmailRecord;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
};

export const sendWorkspaceEmail = async ({
  workspace,
  to,
  subject,
  text,
  html,
  cc,
  bcc
}: SendWorkspaceEmailParams) => {
  const { gmail, workspaceEmail } = await getWorkspaceGmailClient(workspace);

  const fromAddress = workspaceEmail.display_name
    ? `${workspaceEmail.display_name} <${workspaceEmail.email}>`
    : workspaceEmail.email;

  const rawMessage = buildMimeMessage({
    from: fromAddress,
    to,
    subject,
    text,
    html,
    cc,
    bcc
  });

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: rawMessage
    }
  });

  return response.data;
};
