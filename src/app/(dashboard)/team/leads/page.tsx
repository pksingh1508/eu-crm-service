import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DataTable from "@/components/ui/data-table"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost"
] as const

type SearchParams = {
  status?: string
  query?: string
}

type TeamLeadRow = {
  id: string
  name: string
  email: string | null
  company: string | null
  status: string
  updated_at: string
}

const fetchTeamLeads = async (
  userId: string,
  searchParams: SearchParams
): Promise<TeamLeadRow[]> => {
  const supabaseAdmin = getSupabaseAdminClient()
  const query = searchParams.query?.trim() ?? ""
  const status = searchParams.status ?? "all"

  let leadsQuery = supabaseAdmin
    .from("leads")
    .select("id, name, email, company, status, updated_at")
    .eq("assigned_to", userId)
    .order("updated_at", { ascending: false })
    .limit(100)

  if (query.length > 0) {
    const like = `%${query}%`
    leadsQuery = leadsQuery.or(
      `name.ilike.${like},email.ilike.${like},company.ilike.${like}`
    )
  }

  if (status !== "all") {
    leadsQuery = leadsQuery.eq("status", status)
  }

  const { data, error } = await leadsQuery

  if (error) {
    console.error("[team-leads] failed to load leads", error)
    return []
  }

  return (data ?? []) as unknown as TeamLeadRow[]
}

const TeamLeadsPage = async ({
  searchParams
}: {
  searchParams: SearchParams
}) => {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError) {
    console.error("[team-leads] failed to verify auth user", userError)
  }

  if (!user) {
    redirect("/login")
  }

  const leads = await fetchTeamLeads(user.id, searchParams)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">
          My leads
        </h1>
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
            defaultValue={searchParams.query ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={searchParams.status ?? "all"}>
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
            key: "company",
            header: "Company",
            render: (row) => row.company ?? "—"
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
              <Button asChild size="sm" variant="outline">
                <Link href={`/team/leads/${row.id}`}>Open</Link>
              </Button>
            )
          }
        ]}
        data={leads}
        emptyMessage="No leads found. Update your filters or check back later."
        rowKey={(row) => row.id}
      />
    </div>
  )
}

export default TeamLeadsPage