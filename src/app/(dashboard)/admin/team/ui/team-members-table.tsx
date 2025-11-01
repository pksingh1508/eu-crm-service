
'use client'

import { useEffect } from "react"
import { useFormState } from "react-dom"
import { useRouter } from "next/navigation"

import {
  removeTeamMemberAction,
  updateTeamAssignmentAction,
  type RemoveTeamMemberState,
  type TeamAssignmentState
} from "@/server/team/actions"
import { Button } from "@/components/ui/button"

type TeamMemberRecord = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  workspace_email_id: string | null
  workspace_emails: {
    id: string
    email: string
    display_name: string | null
  } | null
}

type WorkspaceEmailOption = {
  id: string
  email: string
  display_name: string | null
  is_active: boolean | null
}

type TeamMembersTableProps = {
  members: TeamMemberRecord[]
  workspaceEmails: WorkspaceEmailOption[]
}

const assignmentInitialState: TeamAssignmentState = {
  success: false,
  error: undefined
}

const removeInitialState: RemoveTeamMemberState = {
  success: false,
  error: undefined
}

const TeamMembersTable = ({
  members,
  workspaceEmails
}: TeamMembersTableProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Team members
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="px-6 py-3 font-semibold uppercase tracking-wide text-slate-500">
                Member
              </th>
              <th className="px-6 py-3 font-semibold uppercase tracking-wide text-slate-500">
                Role
              </th>
              <th className="px-6 py-3 font-semibold uppercase tracking-wide text-slate-500">
                Workspace email
              </th>
              <th className="px-6 py-3 text-right font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  No team members yet. Invite someone above to get started.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <TeamMemberRow
                  key={member.id}
                  member={member}
                  workspaceEmails={workspaceEmails}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TeamMemberRow = ({
  member,
  workspaceEmails
}: {
  member: TeamMemberRecord
  workspaceEmails: WorkspaceEmailOption[]
}) => {
  const router = useRouter()

  const [assignmentState, assignmentAction] = useFormState(
    updateTeamAssignmentAction,
    assignmentInitialState
  )
  const [removeState, removeAction] = useFormState(
    removeTeamMemberAction,
    removeInitialState
  )

  useEffect(() => {
    if (assignmentState.success || removeState.success) {
      router.refresh()
    }
  }, [assignmentState.success, removeState.success, router])

  const currentWorkspaceEmail =
    member.workspace_emails?.display_name ??
    member.workspace_emails?.email ??
    "Unassigned"

  return (
    <tr>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">
            {member.full_name ?? member.email ?? "Unknown user"}
          </span>
          <span className="text-xs text-slate-500">
            {member.email ?? "No email"}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 capitalize text-slate-700">
        {member.role ?? "team"}
      </td>
      <td className="px-6 py-4">
        <form
          action={assignmentAction}
          className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3"
        >
          <input type="hidden" name="profileId" value={member.id} />
          <select
            name="workspaceEmailId"
            defaultValue={member.workspace_email_id ?? "unassign"}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 md:w-auto"
          >
            <option value="unassign">Unassigned</option>
            {workspaceEmails.map((workspaceEmail) => (
              <option
                key={workspaceEmail.id}
                value={workspaceEmail.id}
                disabled={!workspaceEmail.is_active}
              >
                {workspaceEmail.display_name
                  ? `${workspaceEmail.display_name} (${workspaceEmail.email})`
                  : workspaceEmail.email}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="outline" className="md:w-auto">
            Update
          </Button>
        </form>
        {assignmentState.error ? (
          <p className="mt-1 text-xs text-rose-600">{assignmentState.error}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">
            Current: {currentWorkspaceEmail}
          </p>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <form
          action={removeAction}
          className="inline-flex flex-col items-end gap-2"
        >
          <input type="hidden" name="profileId" value={member.id} />
          <input type="hidden" name="authUserId" value={member.id} />
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            className="md:w-auto"
          >
            Remove
          </Button>
          {removeState.error ? (
            <span className="text-xs text-rose-600">{removeState.error}</span>
          ) : null}
        </form>
      </td>
    </tr>
  )
}

export default TeamMembersTable
