'use server'

import { cookies } from "next/headers"
import { z } from "zod"

import { env } from "@/lib/env"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

type LoginState = {
  success: boolean
  error?: string
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters")
})

export const loginAction = async (
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> => {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid credentials"
    }
  }

  const { email, password } = parsed.data

  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  })

  if (error || !data.session || !data.user) {
    return {
      success: false,
      error: error?.message ?? "Unable to authenticate"
    }
  }

  const pendingPayload = {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user_id: data.user.id,
    email: data.user.email ?? email
  }

  const cookieStore = await cookies()

  cookieStore.delete("pending_session")

  cookieStore.set({
    name: "pending_session",
    value: JSON.stringify(pendingPayload),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60
  })

  const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: pendingPayload.user_id,
      email: pendingPayload.email
    })
  })

  if (!response.ok) {
    cookieStore.delete("pending_session")
    return {
      success: false,
      error: "Failed to send OTP. Please try again."
    }
  }

  return { success: true }
}
