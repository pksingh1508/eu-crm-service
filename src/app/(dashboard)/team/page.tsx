import { redirect } from "next/navigation";

import DataTable from "@/components/ui/data-table";
import StatCard from "@/components/ui/stat-card";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type EmailActivityRow = {
  id: string;
  lead: {
    name: string | null;
    email: string | null;
  } | null;
  payload: {
    subject?: string | null;
  } | null;
  created_at: string;
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

  const userId = user.id;
  const supabaseAdmin = getSupabaseAdminClient();

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const [myEmailsQuery, recentEmailsQuery] = await Promise.all([
    supabaseAdmin
      .from("lead_events")
      .select("id", { head: true, count: "exact" })
      .eq("event_type", "email_sent")
      .eq("actor_id", userId)
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabaseAdmin
      .from("lead_events")
      .select("id, created_at, payload, lead:lead_id(name,email)")
      .eq("event_type", "email_sent")
      .eq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  const myEmailsThisWeek = myEmailsQuery.count ?? 0;
  const recentEmails =
    (recentEmailsQuery.data as EmailActivityRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Email activity
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Review how many emails you have sent recently and revisit the latest
          messages.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Emails sent (7d)"
          value={myEmailsThisWeek.toString()}
          subtitle="Outbound emails this week"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent emails</h2>
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
                  <span className="font-semibold text-slate-900">
                    {row.lead?.name ?? "Unknown"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {row.lead?.email ?? "-"}
                  </span>
                </div>
              )
            },
            {
              key: "payload",
              header: "Subject",
              render: (row) => row.payload?.subject ?? "-"
            }
          ]}
          data={recentEmails}
          emptyMessage="No recent outbound emails."
          rowKey={(row) => row.id}
        />
      </section>
    </div>
  );
};

export default TeamDashboardPage;
