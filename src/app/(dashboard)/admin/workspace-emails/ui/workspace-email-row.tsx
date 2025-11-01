'use client'

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  deleteWorkspaceEmailAction,
  type WorkspaceEmailDeleteState
} from "@/server/workspace-emails/actions"

const initialState: WorkspaceEmailDeleteState = {
  success: false,
  error: undefined
}

type WorkspaceEmailRowProps = {
  email: string
  displayName: string | null
  isActive: boolean | null
  createdAt: string
  workspaceEmailId: string
}

const WorkspaceEmailRow = ({
  email,
  displayName,
  isActive,
  createdAt,
  workspaceEmailId
}: WorkspaceEmailRowProps) => {
  const router = useRouter()
  const [state, formAction] = useActionState(
    deleteWorkspaceEmailAction,
    initialState
  )

  useEffect(() => {
    if (state.success) {
      router.refresh()
    }
  }, [state.success, router])

  return (
    <tr>
      <td className="px-6 py-4 font-medium text-slate-900">{email}</td>
      <td className="px-6 py-4 text-slate-700">
        {displayName ?? "—"}
      </td>
      <td className="px-6 py-4">
        {isActive ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            Inactive
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-slate-500">
        {new Date(createdAt).toLocaleString()}
      </td>
      <td className="px-6 py-4 text-right">
        <form action={formAction} className="inline-flex flex-col items-end gap-2">
          <input type="hidden" name="workspaceEmailId" value={workspaceEmailId} />
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            className="shadow-none"
          >
            Delete
          </Button>
          {state.error ? (
            <span className="text-xs text-rose-600">{state.error}</span>
          ) : null}
        </form>
      </td>
    </tr>
  )
}

export default WorkspaceEmailRow
