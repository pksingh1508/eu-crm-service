import { redirect } from "next/navigation"
import { Mail, Target, Inbox } from "lucide-react"

import StatCard from "@/components/ui/stat-card"
import DataTable from "@/components/ui/data-table"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

type LeadRow = {
  id: string
  name: string
  email: string | null
  status: string
  updated_at: string
}

type EmailActivityRow = {
  id: string
  lead: {
    name: string | null
    email: string | null
  } | null
  payload: {
    subject?: string | null
  } | null
  created_at: string
}

const TeamDashboardPage = async () => {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError) {
    console.error("[team-dashboard] failed to verify auth user", userError)
  }

  if (!user) {
    redirect("/login")
  }

  const userId = user.id
  const supabaseAdmin = getSupabaseAdminClient()

  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)

  const [
    myLeadsQuery,
    myActiveLeadsQuery,
    myEmailsQuery,
    teamEmailsQuery,
    recentLeadsQuery,
    recentEmailsQuery
  ] = await Promise.all([
    supabaseAdmin
      .from("leads")
      .select("id", { head: true, count: "exact" })
      .eq("assigned_to", userId),
    supabaseAdmin
      .from("leads")
      .select("id", { head: true, count: "exact" })
      .eq("assigned_to", userId)
      .not("status", "in", '("won","lost")'),
    supabaseAdmin
      .from("lead_events")
      .select("id")
      .eq("event_type", "email_sent")
      .eq("actor_id", userId)
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabaseAdmin
      .from("lead_events")
      .select("id")
      .eq("event_type", "email_sent")
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabaseAdmin
      .from("leads")
      .select("id, name, email, status, updated_at")
      .eq("assigned_to", userId)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabaseAdmin
      .from("lead_events")
      .select("id, created_at, payload, lead:lead_id(name,email)")
      .eq("event_type", "email_sent")
      .eq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
  ])

  const totalMyLeads = myLeadsQuery.count ?? 0
  const activeMyLeads = myActiveLeadsQuery.count ?? 0
  const myEmailsThisWeek = myEmailsQuery.data?.length ?? 0
  const teamEmailsThisWeek = teamEmailsQuery.data?.length ?? 0
  const recentLeads = (recentLeadsQuery.data ?? []) as unknown as LeadRow[]
  const recentEmails = (recentEmailsQuery.data ?? []) as unknown as EmailActivityRow[]

  const statCards = [
    {
      title: "My assigned leads",
      value: totalMyLeads.toString(),
      subtitle: `${activeMyLeads} active in pipeline`,
      icon: <Inbox className="h-5 w-5" />,
      trend: {
        direction: activeMyLeads > 0 ? ("up" as const) : ("neutral" as const),
        value: activeMyLeads > 0 ? `${activeMyLeads} in progress` : "All settled"
      }
    },
    {
      title: "Emails sent (7d)",
      value: myEmailsThisWeek.toString(),
      subtitle: "Outbound emails this week",
      icon: <Mail className="h-5 w-5" />,
      trend: {
        direction: myEmailsThisWeek > 0 ? ("up" as const) : ("neutral" as const),
        value:
          teamEmailsThisWeek > 0
            ? `${((myEmailsThisWeek / teamEmailsThisWeek) * 100).toFixed(0)}% of team`
            : "No team activity"
      }
    },
    {
      title: "Focus leads",
      value: activeMyLeads.toString(),
      subtitle: "Open leads needing attention",
      icon: <Target className="h-5 w-5" />,
      trend: {
        direction: "neutral" as const,
        value: "Stay consistent!"
      }
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          My performance
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Track your pipeline and keep tabs on recent conversations.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Leads to follow up
          </h2>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Lead",
                render: (row) => (
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">
                      {row.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {row.email ?? "—"}
                    </span>
                  </div>
                )
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 capitalize">
                    {row.status}
                  </span>
                )
              },
              {
                key: "updated_at",
                header: "Updated",
                render: (row) =>
                  new Date(row.updated_at).toLocaleDateString()
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                render: (row) => (
                  <a
                    href={`/team/leads/${row.id}`}
                    className="text-sm font-semibold text-slate-900 underline underline-offset-4"
                  >
                    View
                  </a>
                )
              }
            ]}
            data={recentLeads}
            emptyMessage="No leads assigned yet."
            rowKey={(row) => row.id}
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent emails
          </h2>
          <DataTable
            columns={[
              {
                key: "created_at",
                header: "Sent at",
                render: (row) =>
                  new Date(row.created_at).toLocaleString()
              },
              {
                key: "lead",
                header: "Lead",
                render: (row) => (
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">
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
            data={recentEmails}
            emptyMessage="No recent outbound emails."
            rowKey={(row) => row.id}
          />
        </div>
      </section>
    </div>
  )
}

export default TeamDashboardPage