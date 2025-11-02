import { Mail, Users2, Inbox } from "lucide-react"

import StatCard from "@/components/ui/stat-card"
import DataTable from "@/components/ui/data-table"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

type EmailEventRow = {
  id: string
  actor_id: string | null
  created_at: string
}

type LeadRow = {
  id: string
  name: string
  email: string | null
  status: string
  created_at: string
}

type TeamMember = {
  id: string
  full_name: string | null
  email: string | null
}

const getMetrics = async () => {
  const supabaseAdmin = getSupabaseAdminClient()
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)

  const [
    totalLeadsQuery,
    leadsThisWeekQuery,
    totalEmailEventsQuery,
    emailEventsQuery,
    latestLeadsQuery,
    teamMembersQuery
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
      .select("id", { head: true, count: "exact" })
      .eq("event_type", "email_sent"),
    supabaseAdmin
      .from("lead_events")
      .select("id, actor_id, created_at")
      .eq("event_type", "email_sent")
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabaseAdmin
      .from("leads")
      .select("id, name, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, email", { count: "exact" })
      .eq("role", "team")
      .order("full_name", { ascending: true })
  ])

  const totalLeads = totalLeadsQuery.count ?? 0
  const leadsThisWeek = leadsThisWeekQuery.count ?? 0
  const totalEmailEvents = totalEmailEventsQuery.count ?? 0
  const emailsThisWeek = (emailEventsQuery.data ?? []) as EmailEventRow[]
  const latestLeads = (latestLeadsQuery.data ?? []) as LeadRow[]
  const teamMembers = (teamMembersQuery.data ?? []) as TeamMember[]
  const teamMembersCount = teamMembersQuery.count ?? teamMembers.length

  const teamMemberLookup = new Map(
    teamMembers.map((member) => [member.id, member])
  )

  const emailsByMember = emailsThisWeek.reduce<
    Record<
      string,
      {
        count: number
        name: string
        email: string
      }
    >
  >((acc, event) => {
    const key = event.actor_id ?? "unassigned"
    const member = event.actor_id ? teamMemberLookup.get(event.actor_id) : null

    if (!acc[key]) {
      acc[key] = {
        count: 0,
        name:
          member?.full_name ??
          member?.email ??
          (key === "unassigned" ? "Unassigned" : "Unknown"),
        email:
          member?.email ?? (key === "unassigned" ? "N/A" : "Unknown")
      }
    }

    acc[key].count += 1
    return acc
  }, {})

  const emailsPerMember = Object.entries(emailsByMember)
    .map(([actorId, entry]) => ({
      actorId,
      count: entry.count,
      name: entry.name,
      email: entry.email
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalLeads,
    leadsThisWeek,
    totalEmailEvents,
    emailsThisWeek: emailsThisWeek.length,
    emailsPerMember,
    latestLeads,
    teamMembersCount
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
      direction:
        metrics.leadsThisWeek > 0 ? ("up" as const) : ("neutral" as const),
      value:
        metrics.leadsThisWeek > 0
          ? `${metrics.leadsThisWeek} added last 7 days`
          : "No new leads last 7 days"
    }
  },
  {
    title: "Emails Sent",
    value: metrics.totalEmailEvents.toLocaleString(),
    subtitle: "All-time outbound emails",
    icon: <Mail className="h-5 w-5" />,
    trend: {
      direction:
        metrics.emailsThisWeek > 0 ? ("up" as const) : ("neutral" as const),
      value:
        metrics.emailsThisWeek > 0
          ? `${metrics.emailsThisWeek} in last 7 days`
          : "No emails last 7 days"
    }
  },
  {
    title: "Active Senders",
    value: metrics.teamMembersCount.toLocaleString(),
    subtitle: "Team members with sender access",
    icon: <Users2 className="h-5 w-5" />,
    trend: {
      direction:
        metrics.emailsPerMember.length > 0
          ? ("up" as const)
          : ("neutral" as const),
      value:
        metrics.emailsPerMember.length > 0
          ? `${metrics.emailsPerMember.length} sent last 7 days`
          : "No recent senders"
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

