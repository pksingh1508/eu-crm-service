import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/ui/data-table";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const LEAD_STATUSES = ["new", "email-send"] as const;

type SearchParams = {
  status?: string;
  query?: string;
  page?: string;
};

const PAGE_SIZE = 100;

type TeamLeadResult = {
  leads: TeamLeadRow[];
  page: number;
  totalPages: number | null;
  hasNext: boolean;
  hasPrevious: boolean;
};

type TeamLeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  send_by: string | null;
  updated_at: string;
};

const LEAD_SELECT =
  "id, name, email, phone, company, status, send_by, updated_at";

const fetchTeamLeads = async (
  searchParams: SearchParams,
  userEmail: string | null,
): Promise<TeamLeadResult> => {
  const supabaseAdmin = getSupabaseAdminClient();
  const query = searchParams.query?.trim() ?? "";
  const status = searchParams.status ?? "all";
  const rawPage = Number.parseInt(searchParams.page ?? "1", 10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const normalizedStatus =
    status === "new" || status === "email-send" ? status : "all";
  const like = query.length > 0 ? `%${query}%` : null;
  const searchConditions = like
    ? `name.ilike.${like},email.ilike.${like},company.ilike.${like}`
    : null;

  const applySearch = <T extends { or: (filters: string) => T }>(
    leadsQuery: T,
  ) => (searchConditions ? leadsQuery.or(searchConditions) : leadsQuery);

  const buildStatusQuery = (
    leadStatus: "new" | "email-send",
    pageFrom: number,
    pageTo: number,
  ) => {
    let leadsQuery = supabaseAdmin
      .from("leads")
      .select(LEAD_SELECT, { count: "exact" })
      .eq("status", leadStatus)
      .order("updated_at", { ascending: false })
      .range(pageFrom, pageTo);

    if (leadStatus === "email-send") {
      leadsQuery = userEmail
        ? leadsQuery.eq("send_by", userEmail)
        : leadsQuery.is("id", null);
    }

    return applySearch(leadsQuery);
  };

  const fetchStatusPage = async (
    leadStatus: "new" | "email-send",
    pageFrom: number,
    pageTo: number,
  ) => {
    const { data, error, count } = await buildStatusQuery(
      leadStatus,
      pageFrom,
      pageTo,
    );

    return {
      leads: (data ?? []) as unknown as TeamLeadRow[],
      error,
      count,
    };
  };

  if (normalizedStatus !== "all") {
    const { leads, error, count } = await fetchStatusPage(
      normalizedStatus,
      from,
      to,
    );

    if (error) {
      console.error("[team-leads] failed to load leads", error);
      return {
        leads: [],
        page,
        totalPages:
          count != null ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : null,
        hasNext: false,
        hasPrevious: page > 1,
      };
    }

    const totalPages =
      count != null ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : null;
    const hasNext =
      totalPages != null ? page < totalPages : leads.length === PAGE_SIZE;

    return {
      leads,
      page,
      totalPages,
      hasNext,
      hasPrevious: page > 1,
    };
  }

  const [newCountResult, sentCountResult] = await Promise.all([
    buildStatusQuery("new", 0, 0),
    buildStatusQuery("email-send", 0, 0),
  ]);
  const newCount = newCountResult.count ?? 0;
  const sentCount = sentCountResult.count ?? 0;
  const newRowsNeeded = Math.max(0, Math.min(PAGE_SIZE, newCount - from));
  const sentOffset = Math.max(0, from - newCount);
  const [newResult, sentResult] = await Promise.all([
    newRowsNeeded > 0
      ? fetchStatusPage("new", from, from + newRowsNeeded - 1)
      : Promise.resolve({ leads: [], error: null, count: newCount }),
    newRowsNeeded < PAGE_SIZE
      ? fetchStatusPage(
          "email-send",
          sentOffset,
          sentOffset + (PAGE_SIZE - newRowsNeeded) - 1,
        )
      : Promise.resolve({ leads: [], error: null, count: sentCount }),
  ]);

  const error =
    newCountResult.error ??
    sentCountResult.error ??
    newResult.error ??
    sentResult.error;
  const count = newCount + sentCount;

  if (error) {
    console.error("[team-leads] failed to load leads", error);
    return {
      leads: [],
      page,
      totalPages:
        count != null ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : null,
      hasNext: false,
      hasPrevious: page > 1,
    };
  }

  const leads = [...newResult.leads, ...sentResult.leads];
  const totalPages =
    count != null ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : null;
  const hasNext =
    totalPages != null ? page < totalPages : leads.length === PAGE_SIZE;
  const hasPrevious = page > 1;

  return {
    leads,
    page,
    totalPages,
    hasNext,
    hasPrevious,
  };
};

const TeamLeadsPage = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const resolvedSearchParams = await searchParams;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[team-leads] failed to verify auth user", userError);
  }

  if (!user) {
    redirect("/login");
  }

  const {
    leads,
    page: currentPage,
    totalPages,
    hasNext,
    hasPrevious,
  } = await fetchTeamLeads(resolvedSearchParams, user.email ?? null);

  const buildPageLink = (page: number) => {
    const params = new URLSearchParams();
    if (resolvedSearchParams.query) {
      params.set("query", resolvedSearchParams.query);
    }
    if (resolvedSearchParams.status) {
      params.set("status", resolvedSearchParams.status);
    }
    if (page > 1) {
      params.set("page", page.toString());
    }
    const queryString = params.toString();
    return queryString ? `/team/leads?${queryString}` : "/team/leads";
  };
  const currentListLink = buildPageLink(currentPage);
  const buildLeadLink = (leadId: string) =>
    `/team/leads/${leadId}?returnTo=${encodeURIComponent(currentListLink)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">My leads</h1>
        <p className="text-sm text-slate-600">
          Filter and manage the leads assigned to you.
        </p>
      </div>

      <form
        method="GET"
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3"
      >
        <div className="grid gap-2">
          <Label htmlFor="query">Search</Label>
          <Input
            id="query"
            name="query"
            placeholder="Search by name or company..."
            defaultValue={resolvedSearchParams.query ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select
            name="status"
            defaultValue={resolvedSearchParams.status ?? "all"}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" className="w-full md:w-auto">
            Apply
          </Button>
          <Button variant="outline" asChild>
            <Link href="/team/leads">Reset</Link>
          </Button>
        </div>
      </form>

      <DataTable
        columns={[
          {
            key: "name",
            header: "Lead",
            render: (row) => (
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900">{row.name}</span>
                <span className="text-xs text-slate-500">
                  {row.email ?? "—"}
                </span>
              </div>
            ),
          },
          {
            key: "phone",
            header: "Phone",
            render: (row) => row.phone ?? "—",
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 capitalize">
                {row.status}
              </span>
            ),
          },
          {
            key: "send_by",
            header: "Sent By",
            render: (row) => row.send_by ?? "—",
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (row) => (
              <Button asChild size="sm" variant="outline">
                <Link href={buildLeadLink(row.id)}>Open</Link>
              </Button>
            ),
          },
        ]}
        data={leads}
        emptyMessage="No leads found. Update your filters or check back later."
        rowKey={(row) => row.id}
      />

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-600">
          Page {currentPage}
          {totalPages ? ` of ${totalPages}` : ""}
        </p>
        <div className="flex gap-2">
          {hasPrevious ? (
            <Button variant="outline" asChild>
              <Link href={buildPageLink(currentPage - 1)}>Previous</Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Previous
            </Button>
          )}
          {hasNext ? (
            <Button variant="outline" asChild>
              <Link href={buildPageLink(currentPage + 1)}>Next</Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamLeadsPage;
