'use server'

import { cookies } from "next/headers"

import { LOGIN_SESSION_COOKIE } from "@/lib/login-session"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const logoutAction = async () => {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("[auth] logout failed", error)
    throw new Error("Unable to sign out. Please try again.")
  }

  const cookieStore = await cookies()
  cookieStore.delete("pending_session")
  cookieStore.delete(LOGIN_SESSION_COOKIE)

  return { success: true }
}

