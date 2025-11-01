import TeamInviteCard from "./ui/team-invite-card"
import TeamMembersTable from "./ui/team-members-table"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

type TeamMemberRecord = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  workspace_email_id: string | null
  profiles_created_at?: string
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

const TeamManagementPage = async () => {
  const supabaseAdmin = getSupabaseAdminClient()

  const [{ data: membersData }, { data: workspaceEmailsData }] =
    await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select(
          "id,email,full_name,role,workspace_email_id,created_at,workspace_emails:workspace_email_id(id,email,display_name)"
        )
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("workspace_emails")
        .select("id,email,display_name,is_active")
        .order("email", { ascending: true })
    ])

  const members = (membersData ?? []) as unknown as TeamMemberRecord[]
  const workspaceEmails = (workspaceEmailsData ?? []) as unknown as WorkspaceEmailOption[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Team management
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Invite team members, assign workspace mailboxes, and manage account
          access.
        </p>
      </div>

      <TeamInviteCard />

      <TeamMembersTable
        members={members}
        workspaceEmails={workspaceEmails}
      />
    </div>
  )
}

export default TeamManagementPage
