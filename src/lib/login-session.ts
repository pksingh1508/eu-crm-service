import crypto from "node:crypto"

import type { CookieOptions } from "@supabase/ssr"

import { env } from "./env"

// After a successful password + OTP login, admins and team members stay signed
// in for 2 days, even if they close the browser. The cookie is signed so it
// can't be forged or extended, and src/proxy.ts only accepts a Supabase session
// that comes with a valid one.
export const LOGIN_SESSION_COOKIE = "otp_verified"
const LOGIN_SESSION_MAX_AGE_SECONDS = 2 * 24 * 60 * 60

type LoginSession = {
  userId: string
  expiresAt: number // unix timestamp in seconds
}

const nowInSeconds = () => Math.floor(Date.now() / 1000)

const sign = (payload: string) =>
  crypto
    .createHmac("sha256", env.SUPABASE_SERVICE_ROLE_KEY)
    .update(`login-session:${payload}`)
    .digest("base64url")

export const getLoginSessionExpiry = () =>
  nowInSeconds() + LOGIN_SESSION_MAX_AGE_SECONDS

export const createLoginSessionCookie = ({ userId, expiresAt }: LoginSession) => {
  const payload = `${userId}.${expiresAt}`

  return {
    name: LOGIN_SESSION_COOKIE,
    value: `${payload}.${sign(payload)}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: expiresAt - nowInSeconds()
  }
}

export const readLoginSession = (value?: string): LoginSession | null => {
  const parts = value?.split(".") ?? []

  if (parts.length !== 3) {
    return null
  }

  const [userId, expiresAtRaw, signature] = parts
  const provided = Buffer.from(signature)
  const expected = Buffer.from(sign(`${userId}.${expiresAtRaw}`))

  if (
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(provided, expected)
  ) {
    return null
  }

  const expiresAt = Number(expiresAtRaw)

  return expiresAt > nowInSeconds() ? { userId, expiresAt } : null
}

// @supabase/ssr always writes its auth cookies with a 400 day maxAge. Make them
// expire together with the login session instead (deletions use maxAge 0 and
// are left alone).
export const capToLoginSession = (
  options: CookieOptions,
  expiresAt?: number
): CookieOptions =>
  expiresAt && options.maxAge !== 0
    ? { ...options, maxAge: expiresAt - nowInSeconds() }
    : options
