import crypto from "node:crypto"

const OTP_LENGTH = 6
const OTP_TTL_MS = 5 * 60 * 1000

export const generateOtp = () => {
  const otp = crypto.randomInt(0, 10 ** OTP_LENGTH)
  return otp.toString().padStart(OTP_LENGTH, "0")
}

export const hashOtp = (otp: string) =>
  crypto.createHash("sha256").update(otp).digest("hex")

export const getOtpExpiry = () => new Date(Date.now() + OTP_TTL_MS).toISOString()
