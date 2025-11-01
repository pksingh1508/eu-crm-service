import { redirect } from "next/navigation"

import WorkspaceEmailForm from "./ui/workspace-email-form"
import WorkspaceEmailRow from "./ui/workspace-email-row"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSupabaseServerClient } from "@/lib/supabase/server"

type WorkspaceEmailRowData = {
  id: string
  email: string
  display_name: string | null
  is_active: boolean | null
  created_at: string
}

const WorkspaceEmailsPage = async ({
  searchParams
}: {
  searchParams: Promise<{ status?: string; error?: string }>
}) => {
  const resolvedSearchParams = await searchParams
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    redirect("/")
  }

  const { data: workspaceEmailRows } = await supabaseAdmin
    .from("workspace_emails")
    .select("id,email,display_name,is_active,created_at")
    .order("created_at", { ascending: false })

  const workspaceEmails = workspaceEmailRows ?? []

  const statusMessage =
    resolvedSearchParams?.status === "linked"
      ? "Workspace email connected successfully."
      : resolvedSearchParams?.status === "refreshed"
        ? "Workspace email tokens refreshed successfully."
        : null

  const errorMessage = resolvedSearchParams?.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : null

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 py-12">
      <section className="flex flex-col gap-4">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">
            Workspace Emails
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Connect Google Workspace mailboxes via OAuth so the CRM can send
            Gmail on behalf of your team using the account&rsquo;s own tokens.
          </p>
        </header>

        {errorMessage ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {statusMessage}
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <WorkspaceEmailForm />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-medium">Registered identities</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="px-6 py-3 font-medium uppercase tracking-wide text-slate-500">
                  Email
                </th>
                <th className="px-6 py-3 font-medium uppercase tracking-wide text-slate-500">
                  Display name
                </th>
                <th className="px-6 py-3 font-medium uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 font-medium uppercase tracking-wide text-slate-500">
                  Added on
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-900">
              {workspaceEmails.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No workspace emails registered yet.
                  </td>
                </tr>
              ) : (
                workspaceEmails.map((workspaceEmail: WorkspaceEmailRowData) => (
                  <WorkspaceEmailRow
                    key={workspaceEmail.id}
                    workspaceEmailId={workspaceEmail.id}
                    email={workspaceEmail.email}
                    displayName={workspaceEmail.display_name}
                    isActive={workspaceEmail.is_active}
                    createdAt={workspaceEmail.created_at}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default WorkspaceEmailsPage

