import { redirect } from "next/navigation"

import EmailActivityTable from "@/components/email-activity/email-activity-table"
import RangeFilter from "@/components/email-activity/range-filter"
import ListPagination from "@/components/list/list-pagination"
import ListResults from "@/components/list/list-results"
import ListSearch from "@/components/list/list-search"
import { UrlStateProvider } from "@/components/list/url-state"
import {
  buildTeamEmailHref,
  parseTeamEmailSearchParams,
  TEAM_EMAIL_DEFAULTS,
  TEAM_EMAIL_PATH
} from "@/lib/email-activity"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getTeamEmailsPage } from "@/server/email-activity/queries"

import TeamEmailHeader from "./ui/team-email-header"

const EmailCenterPage = async ({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) => {
  const params = parseTeamEmailSearchParams(await searchParams)
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError) {
    console.error("[email-center] failed to verify auth user", userError)
  }

  if (!user) {
    redirect("/login")
  }

  // Errors are shown by error.tsx, with a "Try again" button
  const { items, total, pageCount } = await getTeamEmailsPage(params, user.id)

  // e.g. an old link to a page past the end, after a new search
  if (params.page > pageCount) {
    redirect(buildTeamEmailHref({ ...params, page: pageCount }))
  }

  return (
    <UrlStateProvider
      pathname={TEAM_EMAIL_PATH}
      params={params}
      defaults={TEAM_EMAIL_DEFAULTS}
    >
      <div className="@container space-y-6">
        <TeamEmailHeader />

        <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <ListSearch
            placeholder="Lead name or email"
            label="Search emails"
            className="@3xl:max-w-sm"
          />
          <RangeFilter />
        </div>

        <ListResults label="Sent emails">
          <EmailActivityTable
            items={items}
            resultKey={buildTeamEmailHref(params)}
            hasFilters={params.query !== "" || params.range !== "all"}
            scope="own"
          />
          {total > 0 ? (
            <ListPagination total={total} pageCount={pageCount} />
          ) : null}
        </ListResults>
      </div>
    </UrlStateProvider>
  )
}

export default EmailCenterPage
