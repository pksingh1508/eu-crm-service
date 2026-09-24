import { Mail, Users2, Inbox } from "lucide-react";

import StatCard from "@/components/ui/stat-card";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

import DashboardHeader from "./ui/dashboard-header";
import { RECENT_LEADS_LIMIT, RecentLeads } from "./ui/recent-leads";
import { TeamActivity } from "./ui/team-activity";

type EmailEventRow = {
  id: string;
  actor_id: string | null;
  created_at: string;
};

type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  status: string;
  created_at: string;
};

type TeamMember = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const getMetrics = async () => {
  const supabaseAdmin = getSupabaseAdminClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const [
    totalLeadsQuery,
    leadsThisWeekQuery,
    totalEmailEventsQuery,
    emailEventsQuery,
    latestLeadsQuery,
    teamMembersQuery
  ] = await Promise.all([
    supabaseAdmin.from("leads").select("id", { head: true, count: "exact" }),
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
      .limit(RECENT_LEADS_LIMIT),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, email", { count: "exact" })
      .eq("role", "team")
      .order("full_name", { ascending: true })
  ]);

  const totalLeads = totalLeadsQuery.count ?? 0;
  const leadsThisWeek = leadsThisWeekQuery.count ?? 0;
  const totalEmailEvents = totalEmailEventsQuery.count ?? 0;
  const emailsThisWeek = (emailEventsQuery.data ?? []) as EmailEventRow[];
  const latestLeads = (latestLeadsQuery.data ?? []) as LeadRow[];
  const teamMembers = (teamMembersQuery.data ?? []) as TeamMember[];
  const teamMembersCount = teamMembersQuery.count ?? teamMembers.length;

  const teamMemberLookup = new Map(
    teamMembers.map((member) => [member.id, member])
  );

  const emailsByMember = emailsThisWeek.reduce<
    Record<
      string,
      {
        count: number;
        name: string;
        email: string;
      }
    >
  >((acc, event) => {
    const key = event.actor_id ?? "unassigned";
    const member = event.actor_id ? teamMemberLookup.get(event.actor_id) : null;

    if (!acc[key]) {
      acc[key] = {
        count: 0,
        name:
          member?.full_name ??
          member?.email ??
          (key === "unassigned" ? "Unassigned" : "Unknown"),
        email: member?.email ?? (key === "unassigned" ? "N/A" : "Unknown")
      };
    }

    acc[key].count += 1;
    return acc;
  }, {});

  const emailsPerMember = Object.entries(emailsByMember)
    .map(([actorId, entry]) => ({
      actorId,
      count: entry.count,
      name: entry.name,
      email: entry.email
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalLeads,
    leadsThisWeek,
    totalEmailEvents,
    emailsThisWeek: emailsThisWeek.length,
    emailsPerMember,
    latestLeads,
    teamMembersCount
  };
};

const AdminDashboardPage = async () => {
  const metrics = await getMetrics();

  const statCards = [
    {
      title: "Total Leads",
      value: metrics.totalLeads.toLocaleString(),
      subtitle: "All-time captured leads",
      icon: <Inbox />,
      trend: {
        direction:
          metrics.leadsThisWeek > 0 ? ("up" as const) : ("neutral" as const),
        value:
          metrics.leadsThisWeek > 0
            ? `${metrics.leadsThisWeek.toLocaleString()} added in the last 7 days`
            : "No new leads in the last 7 days"
      }
    },
    {
      title: "Emails Sent",
      value: metrics.totalEmailEvents.toLocaleString(),
      subtitle: "All-time outbound emails",
      icon: <Mail />,
      trend: {
        direction:
          metrics.emailsThisWeek > 0 ? ("up" as const) : ("neutral" as const),
        value:
          metrics.emailsThisWeek > 0
            ? `${metrics.emailsThisWeek.toLocaleString()} sent in the last 7 days`
            : "No emails in the last 7 days"
      }
    },
    {
      title: "Active Senders",
      value: metrics.teamMembersCount.toLocaleString(),
      subtitle: "Team members with sender access",
      icon: <Users2 />,
      trend: {
        direction:
          metrics.emailsPerMember.length > 0
            ? ("up" as const)
            : ("neutral" as const),
        value:
          metrics.emailsPerMember.length > 0
            ? `${metrics.emailsPerMember.length} sent emails in the last 7 days`
            : "No recent senders"
      }
    }
  ];

  return (
    // Column counts follow the width of the content area (a container query),
    // so they account for the sidebar
    <div className="@container space-y-6 md:space-y-8">
      <DashboardHeader />

      <section
        aria-label="Key metrics"
        className="grid gap-4 md:gap-6 @xl:grid-cols-2 @4xl:grid-cols-3"
      >
        {statCards.map((card, index) => (
          <StatCard
            key={card.title}
            {...card}
            className={cn(
              "motion-safe:animate-fade-in-up",
              // On two columns, the last card takes the full row
              index === statCards.length - 1 && "@xl:col-span-2 @4xl:col-span-1"
            )}
            style={{ animationDelay: `${index * 70}ms` }}
          />
        ))}
      </section>

      <div className="grid gap-4 md:gap-6 @4xl:grid-cols-5">
        <TeamActivity
          members={metrics.emailsPerMember}
          className="@4xl:col-span-2"
        />
        <RecentLeads leads={metrics.latestLeads} className="@4xl:col-span-3" />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
