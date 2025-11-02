export const revalidate = 0;

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import DataTable from "@/components/ui/data-table";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type TeamMemberOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type EmailActivityRow = {
  id: string;
  created_at: string;
  payload: {
    subject?: string | null;
    textBody?: string | null;
    [key: string]: any;
  } | null;
  lead: {
    name: string | null;
    email: string | null;
  } | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
};

const DATE_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" }
] as const;

type SearchParams = {
  member?: string;
  range?: (typeof DATE_RANGES)[number]["value"];
};

const createdAtFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "short",
  timeStyle: "medium"
});

const getRangeStart = (range: SearchParams["range"]) => {
  const now = new Date();
  switch (range) {
    case "7d": {
      const date = new Date(now);
      date.setDate(now.getDate() - 7);
      return date;
    }
    case "30d": {
      const date = new Date(now);
      date.setDate(now.getDate() - 30);
      return date;
    }
    case "90d": {
      const date = new Date(now);
      date.setDate(now.getDate() - 90);
      return date;
    }
    default:
      return null;
  }
};

const EmailActivityPage = async ({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const resolvedSearchParams = await searchParams;
  const supabaseAdmin = getSupabaseAdminClient();

  const range = resolvedSearchParams.range ?? "all";
  const member = resolvedSearchParams.member ?? "all";
  const rangeStart = getRangeStart(range);

  const { data: membersData, error: membersError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "team")
    .order("full_name", { ascending: true });

  if (membersError) {
    console.error(
      "[admin-email-activity] failed to load team members",
      membersError
    );
  }

  let eventsBuilder = supabaseAdmin
    .from("lead_events")
    .select("id, created_at, payload, actor_id, lead:lead_id(name,email)")
    .eq("event_type", "email_sent")
    .order("created_at", { ascending: false })
    .limit(100);

  if (member !== "all") {
    eventsBuilder = eventsBuilder.eq("actor_id", member);
  }

  if (rangeStart) {
    eventsBuilder = eventsBuilder.gte("created_at", rangeStart.toISOString());
  }

  const { data: eventsData, error: eventsError } = await eventsBuilder;

  if (eventsError) {
    console.error(
      "[admin-email-activity] failed to load email events",
      eventsError
    );
  }

  const teamMembers = (membersData ?? []) as unknown as TeamMemberOption[];
  const teamMemberById = new Map(
    teamMembers.map((member) => [member.id, member])
  );

  type RawEvent = {
    id: string;
    created_at: string;
    payload: EmailActivityRow["payload"];
    lead: EmailActivityRow["lead"];
    actor_id: string | null;
  };

  const events = (eventsData ?? []).map((raw) => {
    const event = raw as unknown as RawEvent;
    const member = event.actor_id ? teamMemberById.get(event.actor_id) : null;

    return {
      id: event.id,
      created_at: event.created_at,
      payload: event.payload,
      lead: event.lead,
      profiles: member
        ? {
            full_name: member.full_name,
            email: member.email
          }
        : null
    } as EmailActivityRow;
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Email activity log
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Review outbound email history, filter by team member, and audit lead
          interactions.
        </p>
      </div>

      <form
        method="GET"
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3"
      >
        <div className="grid gap-2">
          <Label htmlFor="member">Team member</Label>
          <Select name="member" defaultValue={member}>
            <SelectTrigger id="member">
              <SelectValue placeholder="All members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              {teamMembers.map((teamMember) => (
                <SelectItem key={teamMember.id} value={teamMember.id}>
                  {teamMember.full_name ?? teamMember.email ?? "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="range">Date range</Label>
          <Select name="range" defaultValue={range}>
            <SelectTrigger id="range">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" className="w-full md:w-auto">
            Apply filters
          </Button>
          <Button variant="outline" asChild>
            <a href="/admin/email-activity">Clear</a>
          </Button>
        </div>
      </form>

      <DataTable
        columns={[
          {
            key: "created_at",
            header: "Sent at",
            render: (row) => createdAtFormatter.format(new Date(row.created_at))
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
            key: "profiles",
            header: "Sender",
            render: (row) => (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900">
                  {row.profiles?.full_name ?? row.profiles?.email ?? "Unknown"}
                </span>
                <span className="text-xs text-slate-500">
                  {row.profiles?.email ?? "-"}
                </span>
              </div>
            )
          },
          {
            key: "subject",
            header: "Subject",
            render: (row) =>
              row.payload?.subject ?? row.payload?.request?.subject ?? "-"
          },
          {
            key: "payload",
            header: "Details",
            render: (row) => (
              <div className="max-w-xs text-xs text-slate-600">
                {row.payload?.textBody
                  ? row.payload.textBody.slice(0, 120)
                  : "No preview available."}
              </div>
            )
          }
        ]}
        data={events}
        emptyMessage="No email events for the selected filters."
        rowKey={(row) => row.id}
      />
    </div>
  );
};

export default EmailActivityPage;
