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
  SelectValue
} from "@/components/ui/select";
import DataTable from "@/components/ui/data-table";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminLeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  send_by: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
};

const leadStatuses = ["new", "email-send"] as const;

type SearchParams = {
  query?: string;
  status?: string;
};

const fetchLeads = async (params: SearchParams): Promise<AdminLeadRow[]> => {
  const supabaseAdmin = getSupabaseAdminClient();
  const query = params.query?.trim() ?? "";
  const status = params.status ?? "all";

  let leadsQuery = supabaseAdmin
    .from("leads")
    .select(
      "id, name, email, phone, company, status, send_by, assigned_to, created_at, profiles:assigned_to(full_name,email)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (query.length > 0) {
    const like = `%${query}%`;
    leadsQuery = leadsQuery.or(
      `name.ilike.${like},email.ilike.${like},company.ilike.${like}`
    );
  }

  if (status !== "all") {
    leadsQuery = leadsQuery.eq("status", status);
  }

  const { data, error } = await leadsQuery;

  if (error) {
    console.error("[admin-leads] failed to load leads", error);
    redirect("/admin?error=Unable to load leads");
  }

  return (data ?? []) as unknown as AdminLeadRow[];
};

const AdminLeadsPage = async ({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const resolvedParams = await searchParams;
  const leads = await fetchLeads(resolvedParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Leads</h1>
          <p className="mt-2 text-sm text-slate-600">
            View and manage every lead captured across your workspace.
          </p>
        </div>
        {/* <Button asChild>
          <Link href="/team/leads">Switch to team view</Link>
        </Button> */}
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
            placeholder="Search by name, email, company..."
            defaultValue={resolvedParams.query ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={resolvedParams.status ?? "all"}>
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {leadStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
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
            <Link href="/admin/leads">Clear</Link>
          </Button>
        </div>
      </form>

      <DataTable
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row) => (
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900">{row.name}</span>
              </div>
            )
          },
          {
            key: "email",
            header: "Email",
            render: (row) => row.email ?? "—"
          },
          {
            key: "phone",
            header: "Phone",
            render: (row) => row.phone ?? "—"
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
            key: "send_by",
            header: "Sent By",
            render: (row) => row.send_by ?? "—"
          },
          {
            key: "created_at",
            header: "Created",
            render: (row) => new Date(row.created_at).toLocaleDateString()
          }
        ]}
        data={leads}
        rowKey={(row) => row.id}
      />
    </div>
  );
};

export default AdminLeadsPage;
