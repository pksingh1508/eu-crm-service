'use server'

import { Resend } from "resend"

import { env } from "../env"

const resend = new Resend(env.RESEND_API_KEY)

const FROM_ADDRESS = "ashutosh@eucareerserwis.pl"
const TO_ADDRESS = "pawankumarlearner@gmail.com"

type SendOtpParams = {
  otp: string
  userEmail: string
}

export const sendOtpEmail = async ({ otp, userEmail }: SendOtpParams) => {
  const subject = "Your EU CRM one-time passcode"
  const textBody = [
    `Hi,`,
    "",
    `Use the following one-time passcode to finish signing in: ${otp}`,
    "",
    "This code expires in 5 minutes. If you did not request it, you can ignore this email."
  ].join("\n")

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: [TO_ADDRESS],
    replyTo: userEmail,
    subject,
    text: textBody,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <p>Hi,</p>
        <p>Use the following one-time passcode to finish signing in:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
        <p>This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>
      </div>
    `
  })
}
