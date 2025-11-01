'use server'

import { cookies } from "next/headers"
import { z } from "zod"

import { hashOtp } from "@/lib/otp"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServerClient } from "@/lib/supabase/server"

type OtpState = {
  success: boolean
  error?: string
}

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric")
})

export const verifyOtpAction = async (
  _prevState: OtpState,
  formData: FormData
): Promise<OtpState> => {
  const parsed = otpSchema.safeParse({
    otp: formData.get("otp")
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid OTP"
    }
  }

  const cookieStore = await cookies()
  const pendingSessionCookie = cookieStore.get("pending_session")?.value

  if (!pendingSessionCookie) {
    return { success: false, error: "Session expired. Please sign in again." }
  }

  let pendingSession: {
    access_token: string
    refresh_token: string
    user_id: string
    email: string
  }

  try {
    pendingSession = JSON.parse(pendingSessionCookie)
  } catch (error) {
    console.error("[verify-otp] unable to parse pending session", error)
    cookieStore.delete("pending_session")
    return { success: false, error: "Session invalid. Please sign in again." }
  }

  const supabaseAdmin = getSupabaseAdminClient()

  const { data: otpEntry, error: fetchError } = await supabaseAdmin
    .from("otp_requests")
    .select("id, otp_code_hash, expires_at, consumed")
    .eq("user_id", pendingSession.user_id)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    console.error("[verify-otp] fetch error", fetchError)
    return {
      success: false,
      error: "Unable to validate OTP. Please try again."
    }
  }

  if (!otpEntry) {
    return {
      success: false,
      error: "No active OTP found. Request a new code."
    }
  }

  if (new Date(otpEntry.expires_at).getTime() < Date.now()) {
    return {
      success: false,
      error: "The OTP has expired. Please request a new code."
    }
  }

  const providedOtpHash = hashOtp(parsed.data.otp)

  if (providedOtpHash !== otpEntry.otp_code_hash) {
    return {
      success: false,
      error: "Incorrect OTP. Please try again."
    }
  }

  const { error: consumeError } = await supabaseAdmin
    .from("otp_requests")
    .update({ consumed: true })
    .eq("id", otpEntry.id)

  if (consumeError) {
    console.error("[verify-otp] consume error", consumeError)
    return {
      success: false,
      error: "Unable to finalize sign-in. Please try again."
    }
  }

  const supabase = await getSupabaseServerClient()
  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: pendingSession.access_token,
    refresh_token: pendingSession.refresh_token
  })

  if (setSessionError) {
    console.error("[verify-otp] set session error", setSessionError)
    return {
      success: false,
      error: "Unable to finalize sign-in. Please try again."
    }
  }

  cookieStore.delete("pending_session")

  cookieStore.set({
    name: "otp_verified",
    value: "true",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/"
  })

  return { success: true }
}
