import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { exchangeCodeForTokens, getGmailClientFromTokens } from "@/lib/google";
import { env } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const redirectTo = (path: string) =>
  NextResponse.redirect(new URL(path, env.NEXT_PUBLIC_APP_URL));

type PendingWorkspaceLink = {
  state: string;
  email: string;
  displayName: string;
  userId: string;
};

export const GET = async (request: Request) => {
  // Basic configuration sanity check to surface misconfiguration early
  const missing: string[] = [];
  if (!env.GOOGLE_OAUTH_CLIENT_ID) missing.push("GOOGLE_OAUTH_CLIENT_ID");
  if (!env.GOOGLE_OAUTH_CLIENT_SECRET)
    missing.push("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!env.GOOGLE_OAUTH_REDIRECT_URI) missing.push("GOOGLE_OAUTH_REDIRECT_URI");

  if (missing.length > 0) {
    console.error("[workspace-oauth-callback] missing env", missing);
    const response = redirectTo(
      "/admin/workspace-emails?error=" +
        encodeURIComponent(
          `Server missing Google OAuth config: ${missing.join(", ")}`
        )
    );
    return response;
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const pendingRaw = cookieStore.get("workspace_oauth_state")?.value;

  if (!pendingRaw) {
    const response = redirectTo(
      "/admin/workspace-emails?error=" +
        encodeURIComponent("Authorization session expired. Please start over.")
    );
    response.cookies.delete("workspace_oauth_state");
    return response;
  }

  let pending: PendingWorkspaceLink;

  try {
    pending = JSON.parse(pendingRaw);
  } catch (error) {
    console.error(
      "[workspace-oauth-callback] failed to parse pending payload",
      error
    );
    const response = redirectTo(
      "/admin/workspace-emails?error=" +
        encodeURIComponent("Authorization session invalid. Please start over.")
    );
    response.cookies.delete("workspace_oauth_state");
    return response;
  }

  if (oauthError) {
    const response = redirectTo(
      "/admin/workspace-emails?error=" +
        encodeURIComponent(`Google authorization failed: ${oauthError}`)
    );
    response.cookies.delete("workspace_oauth_state");
    return response;
  }

  if (!code || !state || state !== pending.state) {
    const response = redirectTo(
      "/admin/workspace-emails?error=" +
        encodeURIComponent("Authorization state mismatch. Please start over.")
    );
    response.cookies.delete("workspace_oauth_state");
    return response;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    const gmail = getGmailClientFromTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiryDate: tokens.expiryDate
    });

    const { data: profile } = await gmail.users.getProfile({
      userId: "me"
    });

    const resolvedEmail = profile.emailAddress ?? pending.email;
    const supabaseAdmin = getSupabaseAdminClient();

    const { error: upsertError } = await supabaseAdmin
      .from("workspace_emails")
      .upsert({
        email: pending.email,
        google_account_id: resolvedEmail,
        display_name: pending.displayName,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.expiryDate
          ? new Date(tokens.expiryDate).toISOString()
          : null,
        token_scope: tokens.scope ?? null,
        token_type: tokens.tokenType ?? null,
        created_by: pending.userId,
        is_active: true
      });

    if (upsertError) {
      throw upsertError;
    }

    const response = redirectTo("/admin/workspace-emails?status=linked");
    response.cookies.delete("workspace_oauth_state");
    return response;
  } catch (error: any) {
    // Improve diagnostics: serialize Google error details and provide actionable hint
    const message =
      typeof error?.message === "string" ? error.message : "Unknown error";
    const googleData = error?.response?.data ?? error?.errors ?? null;
    let details = "";
    try {
      details = googleData
        ? typeof googleData === "string"
          ? googleData
          : JSON.stringify(googleData)
        : "";
    } catch {
      details = String(googleData);
    }

    const isInvalidClient = message.includes("invalid_client");

    console.error("[workspace-oauth-callback] token exchange failed", {
      message,
      details,
      clientIdTail: env.GOOGLE_OAUTH_CLIENT_ID.slice(-6),
      redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI
    });

    const hint = isInvalidClient
      ? "Google OAuth invalid_client. Verify Client ID/Secret and Redirect URI in Google Cloud Console and env."
      : "Unable to finalize Google authorization. Please try again.";

    const response = redirectTo(
      "/admin/workspace-emails?error=" + encodeURIComponent(hint)
    );
    response.cookies.delete("workspace_oauth_state");
    return response;
  }
};
