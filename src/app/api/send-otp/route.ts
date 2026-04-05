import { NextResponse } from "next/server"
import { z } from "zod"

import { dispatchOtpForUser } from "@/server/auth/otp"

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

  try {
    await dispatchOtpForUser({ userId, email })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[send-otp] failed", error)
    return NextResponse.json(
      { message: "Failed to dispatch OTP" },
      { status: 500 }
    )
  }
}
