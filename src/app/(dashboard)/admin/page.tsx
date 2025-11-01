import { Mail, Users2, Inbox } from "lucide-react"

import StatCard from "@/components/ui/stat-card"
import DataTable from "@/components/ui/data-table"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

type EmailEventRow = {
  id: string
  actor_id: string | null
  created_at: string
  profiles?: {
    full_name: string | null
    email: string | null
  } | null
}

type LeadRow = {
  id: string
  name: string
  email: string | null
  status: string
  created_at: string
}

const getMetrics = async () => {
  const supabaseAdmin = getSupabaseAdminClient()
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)

  const [
    totalLeadsQuery,
    leadsThisWeekQuery,
    emailEventsQuery,
    latestLeadsQuery
  ] = await Promise.all([
    supabaseAdmin
      .from("leads")
      .select("id", { head: true, count: "exact" }),
    supabaseAdmin
      .from("leads")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabaseAdmin
      .from("lead_events")
      .select(
        "id, actor_id, created_at, profiles:actor_id(full_name,email)"
      )
      .eq("event_type", "email_sent")
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabaseAdmin
      .from("leads")
      .select("id, name, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8)
  ])

  const totalLeads = totalLeadsQuery.count ?? 0
  const leadsThisWeek = leadsThisWeekQuery.count ?? 0
  const emailsThisWeek = (emailEventsQuery.data ?? []) as unknown as EmailEventRow[]
  const latestLeads = (latestLeadsQuery.data ?? []) as unknown as LeadRow[]

  const emailsByMember = emailsThisWeek.reduce<
    Record<
      string,
      {
        count: number
        profile: {
          email: string | null
          full_name: string | null
        }
      }
    >
  >((acc, event) => {
    const key = event.actor_id ?? "unassigned"
    if (!acc[key]) {
      acc[key] = {
        count: 0,
        profile: {
          email: event.profiles?.email ?? null,
          full_name: event.profiles?.full_name ?? null
        }
      }
    }
    acc[key].count += 1
    return acc
  }, {})

  const emailsPerMember = Object.entries(emailsByMember)
    .map(([actorId, entry]) => ({
      actorId,
      count: entry.count,
      name: entry.profile.full_name ?? entry.profile.email ?? "Unknown",
      email: entry.profile.email ?? "N/A"
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalLeads,
    leadsThisWeek,
    emailsThisWeek: emailsThisWeek.length,
    emailsPerMember,
    latestLeads
  }
}

const AdminDashboardPage = async () => {
  const metrics = await getMetrics()

  const statCards = [
    {
      title: "Total Leads",
      value: metrics.totalLeads.toLocaleString(),
      subtitle: "All-time captured leads",
      icon: <Inbox className="h-5 w-5" />,
      trend: {
        direction: "up" as const,
        value: `${metrics.leadsThisWeek} this week`
      }
    },
    {
      title: "Emails Sent (7d)",
      value: metrics.emailsThisWeek.toLocaleString(),
      subtitle: "Outbound emails logged",
      icon: <Mail className="h-5 w-5" />,
      trend: {
        direction: metrics.emailsThisWeek > 0 ? ("up" as const) : ("neutral" as const),
        value:
          metrics.emailsThisWeek > 0
            ? `${metrics.emailsThisWeek} this week`
            : "No email activity"
      }
    },
    {
      title: "Active Senders",
      value: metrics.emailsPerMember.length.toString(),
      subtitle: "Team members who sent email",
      icon: <Users2 className="h-5 w-5" />,
      trend: {
        direction: "neutral" as const,
        value: "Last 7 days"
      }
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Monitor lead intake and outbound email performance across your team.
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
            Emails sent per member (7d)
          </h2>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Team member"
              },
              {
                key: "email",
                header: "Email"
              },
              {
                key: "count",
                header: "Emails sent",
                className: "text-right",
                render: (row) => (
                  <span className="font-semibold text-slate-900">
                    {row.count}
                  </span>
                )
              }
            ]}
            data={metrics.emailsPerMember}
            emptyMessage="No email activity recorded in the last 7 days."
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent leads
          </h2>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Lead"
              },
              {
                key: "email",
                header: "Email"
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
                key: "created_at",
                header: "Created",
                render: (row) =>
                  new Date(row.created_at).toLocaleDateString()
              }
            ]}
            data={metrics.latestLeads}
            emptyMessage="No leads captured yet."
            rowKey={(row) => row.id}
          />
        </div>
      </section>
    </div>
  )
}

export default AdminDashboardPage
