import { createServerClient } from "@supabase/ssr"
import { isAuthRetryableFetchError } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { env } from "@/lib/env"
import {
  LOGIN_SESSION_COOKIE,
  capToLoginSession,
  readLoginSession
} from "@/lib/login-session"

// Runs before every request. Supabase access tokens expire after an hour and
// Server Components can't write cookies, so this is where the session gets
// refreshed and saved. It also ends any Supabase session that doesn't come with
// a valid login session (OTP never completed, or the 2 days are over).
export const proxy = async (request: NextRequest) => {
  const loginSession = readLoginSession(
    request.cookies.get(LOGIN_SESSION_COOKIE)?.value
  )
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update the request too, so the page rendered for it sees the new session
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(
              name,
              value,
              capToLoginSession(options, loginSession?.expiresAt)
            )
          )
        }
      }
    }
  )

  if (loginSession) {
    // Refreshes the access token if it has expired, then verifies it
    const { data, error } = await supabase.auth.getClaims()

    if (error && isAuthRetryableFetchError(error)) {
      // Supabase is unreachable right now; don't sign the user out over it
      return response
    }

    if (data?.claims.sub === loginSession.userId) {
      return response
    }
  }

  await supabase.auth.signOut({ scope: "local" })

  if (request.cookies.has(LOGIN_SESSION_COOKIE)) {
    response.cookies.delete(LOGIN_SESSION_COOKIE)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
}
