"use client"

import { useEffect, useRef } from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import {
  createWorkspaceEmailAction,
  type WorkspaceEmailFormState
} from "@/server/workspace-emails/actions"

const initialState: WorkspaceEmailFormState = {
  success: false,
  error: undefined,
  authUrl: undefined
}

const SubmitButton = () => {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 md:w-auto"
      disabled={pending}
    >
      {pending ? "Preparing Google consent..." : "Connect with Google"}
    </button>
  )
}

const WorkspaceEmailForm = () => {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [state, formAction] = useActionState(
    createWorkspaceEmailAction,
    initialState
  )

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  useEffect(() => {
    if (state.authUrl) {
      window.location.href = state.authUrl
    }
  }, [state.authUrl])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-6"
      autoComplete="off"
    >
      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : state.success ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Redirecting to Google for mailbox authorization…
        </div>
      ) : null}

      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Google Workspace email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="workspace-user@example.com"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="displayName"
          className="text-sm font-medium text-slate-700"
        >
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          placeholder="Full Name"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        />
      </div>

      <p className="text-xs text-slate-500">
        After clicking &ldquo;Connect with Google,&rdquo; you will be redirected to Google
        to grant Gmail access on behalf of this mailbox. Once approved, you will return
        here automatically.
      </p>

      <div>
        <SubmitButton />
      </div>
    </form>
  )
}

export default WorkspaceEmailForm
