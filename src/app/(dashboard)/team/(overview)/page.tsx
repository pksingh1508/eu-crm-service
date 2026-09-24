import { redirect } from "next/navigation";
import { Inbox, Mail, Send } from "lucide-react";

import StatCard from "@/components/ui/stat-card";
import { formatTimeAgo } from "@/lib/dates";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cn, formatNumber } from "@/lib/utils";

import {
  LEADS_QUEUE_LIMIT,
  LeadsQueue,
  type QueuedLead
} from "./ui/leads-queue";
import {
  RECENT_EMAILS_LIMIT,
  RecentEmails,
  type RecentEmail
} from "./ui/recent-emails";
import TeamDashboardHeader from "./ui/team-dashboard-header";

const DAY_MS = 86_400_000;

const getDashboard = async (userId: string) => {
  const supabaseAdmin = getSupabaseAdminClient();
  const now = Date.now();
  const dayAgo = new Date(now - DAY_MS).toISOString();
  const weekAgo = new Date(now - 7 * DAY_MS).toISOString();

  const countSentEmails = () =>
    supabaseAdmin
      .from("lead_events")
      .select("id", { head: true, count: "exact" })
      .eq("event_type", "email_sent")
      .eq("actor_id", userId);

  const countNewLeads = () =>
    supabaseAdmin
      .from("leads")
      .select("id", { head: true, count: "exact" })
      .eq("status", "new");

  const results = await Promise.all([
    countSentEmails().gte("created_at", weekAgo),
    countSentEmails().gte("created_at", dayAgo),
    countSentEmails(),
    supabaseAdmin
      .from("lead_events")
      // Only the subject from the payload, which also holds the email's HTML
      .select("id, created_at, subject:payload->>subject, lead:lead_id(id,name,email)")
      .eq("event_type", "email_sent")
      .eq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(RECENT_EMAILS_LIMIT),
    countNewLeads(),
    // Leads that came in, or filled in the form again, in the last day
    countNewLeads().gte("updated_at", dayAgo),
    supabaseAdmin
      .from("leads")
      .select("id, name, email, phone, updated_at")
      .eq("status", "new")
      .order("updated_at", { ascending: false })
      .limit(LEADS_QUEUE_LIMIT)
  ]);

  results.forEach(({ error }) => {
    if (error) {
      console.error("[team-dashboard] failed to load data", error);
    }
  });

  const [
    sentThisWeek,
    sentToday,
    sentAllTime,
    recentEmails,
    waitingLeads,
    newToday,
    queue
  ] = results;

  return {
    sentThisWeek: sentThisWeek.count ?? 0,
    sentToday: sentToday.count ?? 0,
    sentAllTime: sentAllTime.count ?? 0,
    recentEmails: (recentEmails.data ?? []) as unknown as RecentEmail[],
    waitingLeads: waitingLeads.count ?? 0,
    newToday: newToday.count ?? 0,
    queue: (queue.data ?? []) as unknown as QueuedLead[]
  };
};

const TeamDashboardPage = async () => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[team-dashboard] failed to verify auth user", userError);
  }

  if (!user) {
    redirect("/login");
  }

  const dashboard = await getDashboard(user.id);
  const lastSentAt = dashboard.recentEmails[0]?.created_at;

  const statCards = [
    {
      title: "Emails this week",
      value: formatNumber(dashboard.sentThisWeek),
      subtitle: "Sent in the last 7 days",
      icon: <Send />,
      trend:
        dashboard.sentToday > 0
          ? {
              direction: "up" as const,
              value: `${formatNumber(dashboard.sentToday)} in the last 24 hours`
            }
          : {
              direction: "neutral" as const,
              value: "None in the last 24 hours"
            }
    },
    {
      title: "All-time emails",
      value: formatNumber(dashboard.sentAllTime),
      subtitle: "Every email you've sent",
      icon: <Mail />,
      trend: {
        direction: "neutral" as const,
        value: lastSentAt
          ? `Last one ${formatTimeAgo(lastSentAt)}`
          : "No emails sent yet"
      }
    },
    {
      title: "New leads",
      value: formatNumber(dashboard.waitingLeads),
      subtitle: "Waiting for a first email",
      icon: <Inbox />,
      trend:
        dashboard.newToday > 0
          ? {
              direction: "up" as const,
              value: `${formatNumber(dashboard.newToday)} in the last 24 hours`
            }
          : {
              direction: "neutral" as const,
              value: "None in the last 24 hours"
            }
    }
  ];

  return (
    // Column counts follow the width of the content area (a container query),
    // so they account for the sidebar
    <div className="@container space-y-6 md:space-y-8">
      <TeamDashboardHeader />

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
        <LeadsQueue leads={dashboard.queue} className="@4xl:col-span-2" />
        <RecentEmails
          emails={dashboard.recentEmails}
          className="@4xl:col-span-3"
        />
      </div>
    </div>
  );
};

export default TeamDashboardPage;
