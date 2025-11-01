
import crypto from "node:crypto"
import { google } from "googleapis"

import { env } from "./env"

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly"
]

export const generateStateToken = () => crypto.randomBytes(32).toString("hex")

export const getGoogleOAuthClient = () =>
  new google.auth.OAuth2(
    env.GOOGLE_OAUTH_CLIENT_ID,
    env.GOOGLE_OAUTH_CLIENT_SECRET,
    env.GOOGLE_OAUTH_REDIRECT_URI
  )

export const buildGoogleAuthUrl = (state: string, loginHint?: string) => {
  const oauthClient = getGoogleOAuthClient()

  return oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
    login_hint: loginHint
  })
}

export type OAuthTokenSet = {
  accessToken: string
  refreshToken: string
  expiryDate: number | null
  scope?: string
  tokenType?: string
}

export const exchangeCodeForTokens = async (code: string): Promise<OAuthTokenSet> => {
  try {
    const oauthClient = getGoogleOAuthClient()
    const { tokens } = await oauthClient.getToken({
      code,
      // Ensure the same redirect is used for exchange
      redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI
    })

    if (!tokens || !tokens.access_token) {
      throw new Error("Google OAuth response missing access token.")
    }

    if (!tokens.refresh_token) {
      throw new Error(
        "Google OAuth response missing refresh token. Ensure access_type=offline and prompt=consent."
      )
    }

    const scopeValue = Array.isArray(tokens.scope)
      ? tokens.scope.join(" ")
      : tokens.scope ?? undefined

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date ?? null,
      scope: scopeValue,
      tokenType: tokens.token_type ?? undefined
    }
  } catch (err: any) {
    const message = err?.message || "Unknown error"
    // Surface Google error response when available
    const details = err?.response?.data || err?.stack || ""
    throw new Error(`Google OAuth token exchange failed: ${message}\n${details}`)
  }
}

export const refreshOAuthTokens = async (
  refreshToken: string
): Promise<OAuthTokenSet> => {
  try {
    const oauthClient = getGoogleOAuthClient()
    oauthClient.setCredentials({ refresh_token: refreshToken })

    // google-auth-library will perform the refresh when fetching access token
    const { credentials } = await oauthClient.refreshAccessToken()

    if (!credentials || !credentials.access_token) {
      throw new Error("Failed to refresh Google access token.")
    }

    const scopeValue = Array.isArray(credentials.scope)
      ? credentials.scope.join(" ")
      : credentials.scope ?? undefined

    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token ?? refreshToken,
      expiryDate: credentials.expiry_date ?? null,
      scope: scopeValue,
      tokenType: credentials.token_type ?? undefined
    }
  } catch (err: any) {
    const message = err?.message || "Unknown error"
    const details = err?.response?.data || err?.stack || ""
    throw new Error(`Google OAuth refresh failed: ${message}\n${details}`)
  }
}

type GmailClientParams = {
  accessToken: string
  refreshToken: string
  expiryDate?: number | null
}

export const getGmailClientFromTokens = ({
  accessToken,
  refreshToken,
  expiryDate
}: GmailClientParams) => {
  const oauthClient = getGoogleOAuthClient()
  oauthClient.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate ?? undefined
  })

  return google.gmail({
    version: "v1",
    auth: oauthClient
  })
}


