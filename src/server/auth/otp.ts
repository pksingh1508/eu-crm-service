'use server'

import { sendOtpEmail } from "@/lib/email/send-otp"
import { generateOtp, getOtpExpiry, hashOtp } from "@/lib/otp"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

type DispatchOtpParams = {
  userId: string
  email: string
}

export const dispatchOtpForUser = async ({
  userId,
  email
}: DispatchOtpParams) => {
  const supabaseAdmin = getSupabaseAdminClient()

  const otp = generateOtp()
  const hashedOtp = hashOtp(otp)
  const expiresAt = getOtpExpiry()

  await supabaseAdmin.from("otp_requests").delete().eq("user_id", userId)

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
}
