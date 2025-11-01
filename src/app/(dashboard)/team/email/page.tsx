import { redirect } from "next/navigation"

import DataTable from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

type EmailEventRow = {
  id: string
  created_at: string
  lead: {
    name: string | null
    email: string | null
  } | null
  payload: Record<string, any> | null
}

type SearchParams = {
  query?: string
}

const EmailCenterPage = async ({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) => {
  const resolvedSearchParams = await searchParams
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError) {
    console.error("[email-center] failed to verify auth user", userError)
  }

  if (!user) {
    redirect("/login")
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const { data: eventsData } = await supabaseAdmin
    .from("lead_events")
    .select("id, created_at, payload, lead:lead_id(name,email)")
    .eq("event_type", "email_sent")
    .eq("actor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  const events = (eventsData ?? []) as unknown as EmailEventRow[]

  const query = resolvedSearchParams.query?.trim().toLowerCase() ?? ""
  const filteredEvents =
    query.length === 0
      ? events
      : events.filter((event) => {
          const haystacks = [
            event.lead?.name ?? "",
            event.lead?.email ?? "",
            event.payload?.subject ?? ""
          ]
          return haystacks.some((value) =>
            value.toLowerCase().includes(query)
          )
        })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">Email center</h1>
        <p className="text-sm text-slate-600">
          Review every email you have sent through the CRM.
        </p>
      </div>

      <form
        method="GET"
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end"
      >
        <div className="flex-1">
          <label htmlFor="query" className="text-sm font-medium text-slate-700">
            Search
          </label>
          <Input
            id="query"
            name="query"
            defaultValue={resolvedSearchParams.query ?? ""}
            placeholder="Search by lead or subject..."
            className="mt-1"
          />
        </div>
        <Button type="submit" className="md:w-auto">
          Search
        </Button>
        <Button variant="outline" asChild className="md:w-auto">
          <a href="/team/email">Reset</a>
        </Button>
      </form>

      <DataTable
        columns={[
          {
            key: "created_at",
            header: "Sent at",
            render: (row) => new Date(row.created_at).toLocaleString()
          },
          {
            key: "lead",
            header: "Lead",
            render: (row) => (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">
                  {row.lead?.name ?? "Unknown"}
                </span>
                <span className="text-xs text-slate-500">
                  {row.lead?.email ?? "—"}
                </span>
              </div>
            )
          },
          {
            key: "payload",
            header: "Subject",
            render: (row) => row.payload?.subject ?? "—"
          }
        ]}
        data={filteredEvents}
        emptyMessage="No email activity yet."
        rowKey={(row) => row.id}
      />
    </div>
  )
}

export default EmailCenterPage
