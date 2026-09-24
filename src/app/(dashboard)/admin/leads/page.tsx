import { redirect } from "next/navigation"

import ListPagination from "@/components/list/list-pagination"
import ListResults from "@/components/list/list-results"
import ListSearch from "@/components/list/list-search"
import { UrlStateProvider } from "@/components/list/url-state"
import {
  buildLeadsHref,
  LEADS_DEFAULTS,
  LEADS_PATH,
  parseLeadsSearchParams
} from "@/lib/leads"
import { getLeadsPage } from "@/server/leads/queries"

import LeadsHeader from "./ui/leads-header"
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
    <UrlStateProvider
      pathname={LEADS_PATH}
      params={params}
      defaults={LEADS_DEFAULTS}
    >
      <div className="@container space-y-6">
        <LeadsHeader />

        <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <ListSearch
            placeholder="Name, email, phone or company"
            label="Search leads"
            className="@3xl:max-w-sm"
          />
          <StatusFilter counts={statusCounts} />
        </div>

        <ListResults label="Leads">
          <LeadsTable
            leads={leads}
            resultKey={buildLeadsHref(params)}
            statusCounts={statusCounts}
            showStatusGroups={params.status === "all"}
            hasFilters={params.query !== "" || params.status !== "all"}
          />
          {total > 0 ? (
            <ListPagination total={total} pageCount={pageCount} />
          ) : null}
        </ListResults>
      </div>
    </UrlStateProvider>
  )
}

export default AdminLeadsPage
