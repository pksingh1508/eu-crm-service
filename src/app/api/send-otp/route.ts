import { NextResponse } from "next/server"
import { z } from "zod"

import { sendOtpEmail } from "@/lib/email/send-otp"
import { generateOtp, getOtpExpiry, hashOtp } from "@/lib/otp"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const requestSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email()
})

export const POST = async (request: Request) => {
  const payload = await request.json().catch(() => null)

  const parsed = requestSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { userId, email } = parsed.data
  const supabaseAdmin = getSupabaseAdminClient()

  const otp = generateOtp()
  const hashedOtp = hashOtp(otp)
  const expiresAt = getOtpExpiry()

  try {
    await supabaseAdmin
      .from("otp_requests")
      .delete()
      .eq("user_id", userId)

    const { error: insertError } = await supabaseAdmin.from("otp_requests").insert({
      user_id: userId,
      otp_code_hash: hashedOtp,
      expires_at: expiresAt,
      consumed: false
    })

    if (insertError) {
      throw insertError
    }

    await sendOtpEmail({ otp, userEmail: email })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[send-otp] failed", error)
    return NextResponse.json(
      { message: "Failed to dispatch OTP" },
      { status: 500 }
    )
  }
}

