import { redirect } from "next/navigation"

import StatusFilter from "@/components/leads/status-filter"
import ListPagination from "@/components/list/list-pagination"
import ListResults from "@/components/list/list-results"
import ListSearch from "@/components/list/list-search"
import { UrlStateProvider } from "@/components/list/url-state"
import {
  buildTeamLeadsHref,
  LEADS_DEFAULTS,
  parseLeadsSearchParams,
  TEAM_LEADS_PATH
} from "@/lib/leads"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getTeamLeadsPage } from "@/server/leads/queries"

import TeamLeadsHeader from "./ui/team-leads-header"
import TeamLeadsList from "./ui/team-leads-list"

const TeamLeadsPage = async ({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) => {
  const params = parseLeadsSearchParams(await searchParams)
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

  // Errors are shown by error.tsx, with a "Try again" button
  const { leads, total, pageCount, statusCounts } = await getTeamLeadsPage(
    params,
    user.email ?? null
  )

  // e.g. an old link to a page past the end, after some leads were emailed
  if (params.page > pageCount) {
    redirect(buildTeamLeadsHref({ ...params, page: pageCount }))
  }

  return (
    <UrlStateProvider
      pathname={TEAM_LEADS_PATH}
      params={params}
      defaults={LEADS_DEFAULTS}
    >
      <div className="@container space-y-6">
        <TeamLeadsHeader />

        <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <ListSearch
            placeholder="Name, email, phone or company"
            label="Search leads"
            className="@3xl:max-w-sm"
          />
          <StatusFilter counts={statusCounts} />
        </div>

        <ListResults label="Leads">
          <TeamLeadsList
            leads={leads}
            listHref={buildTeamLeadsHref(params)}
            statusCounts={statusCounts}
            query={params.query}
            status={params.status}
          />
          {total > 0 ? (
            <ListPagination total={total} pageCount={pageCount} />
          ) : null}
        </ListResults>
      </div>
    </UrlStateProvider>
  )
}

export default TeamLeadsPage
