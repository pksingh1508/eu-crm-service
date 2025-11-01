"use client";

import { useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { verifyOtpAction } from "../actions";

const initialState = {
  success: false,
  error: undefined as string | undefined
};

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
    >
      {pending ? "Verifying..." : "Verify OTP"}
    </button>
  );
};

const OtpForm = () => {
  const router = useRouter();
  const [state, formAction] = useActionState(verifyOtpAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.replace("/");
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-2 text-left">
        <label htmlFor="otp" className="text-sm font-medium text-slate-700">
          One-time passcode
        </label>
        <input
          id="otp"
          name="otp"
          inputMode="numeric"
          maxLength={6}
          minLength={6}
          autoComplete="one-time-code"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg tracking-widest shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        />
      </div>

      <SubmitButton />
      <p className="text-center text-xs text-slate-500">
        You&apos;ll receive a one-time passcode after a successful password check.
      </p>
    </form>
  );
};

export default OtpForm;