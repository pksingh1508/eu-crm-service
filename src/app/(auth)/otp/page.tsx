import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import OtpForm from "./ui/otp-form"

export default async function OtpPage() {
  const cookieStore = await cookies()
  const hasPendingSession = Boolean(cookieStore.get("pending_session"))

  if (!hasPendingSession) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Check your email</h1>
          <p className="text-sm text-slate-600">
            Enter the one-time passcode we just emailed to finish signing in.
          </p>
        </div>
        <Suspense fallback={null}>
          <OtpForm />
        </Suspense>
      </div>
    </div>
  )
}
