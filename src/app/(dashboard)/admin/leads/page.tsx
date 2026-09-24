import { redirect } from "next/navigation"

import { buildLeadsHref, parseLeadsSearchParams } from "@/lib/leads"
import { getLeadsPage } from "@/server/leads/queries"

import LeadsHeader from "./ui/leads-header"
import { LeadsNavigationProvider } from "./ui/leads-navigation"
import LeadsPagination from "./ui/leads-pagination"
import LeadsResults from "./ui/leads-results"
import LeadsSearch from "./ui/leads-search"
import LeadsTable from "./ui/leads-table"
import StatusFilter from "./ui/status-filter"

const AdminLeadsPage = async ({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) => {
  const params = parseLeadsSearchParams(await searchParams)
  // Errors are shown by error.tsx, with a "Try again" button
  const { leads, total, pageCount, statusCounts } = await getLeadsPage(params)

  // e.g. an old link to a page past the end, after a new search
  if (params.page > pageCount) {
    redirect(buildLeadsHref({ ...params, page: pageCount }))
  }

  return (
    <LeadsNavigationProvider params={params}>
      <div className="@container space-y-6">
        <LeadsHeader />

        <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <LeadsSearch />
          <StatusFilter counts={statusCounts} />
        </div>

        <LeadsResults>
          <LeadsTable
            leads={leads}
            resultKey={buildLeadsHref(params)}
            statusCounts={statusCounts}
            showStatusGroups={params.status === "all"}
            hasFilters={params.query !== "" || params.status !== "all"}
          />
          {total > 0 ? (
            <LeadsPagination total={total} pageCount={pageCount} />
          ) : null}
        </LeadsResults>
      </div>
    </LeadsNavigationProvider>
  )
}

export default AdminLeadsPage
