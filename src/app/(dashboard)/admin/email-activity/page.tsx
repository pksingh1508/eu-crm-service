import { redirect } from "next/navigation"

import EmailActivityTable from "@/components/email-activity/email-activity-table"
import RangeFilter from "@/components/email-activity/range-filter"
import ListPagination from "@/components/list/list-pagination"
import ListResults from "@/components/list/list-results"
import ListSearch from "@/components/list/list-search"
import { UrlStateProvider } from "@/components/list/url-state"
import {
  buildEmailActivityHref,
  EMAIL_ACTIVITY_DEFAULTS,
  EMAIL_ACTIVITY_PATH,
  parseEmailActivitySearchParams
} from "@/lib/email-activity"
import { getEmailActivityPage } from "@/server/email-activity/queries"

import EmailActivityHeader from "./ui/email-activity-header"
import SenderFilter from "./ui/sender-filter"

const EmailActivityPage = async ({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) => {
  const params = parseEmailActivitySearchParams(await searchParams)
  // Errors are shown by error.tsx, with a "Try again" button
  const { items, total, pageCount, senders } =
    await getEmailActivityPage(params)

  // e.g. an old link to a page past the end, after a new search
  if (params.page > pageCount) {
    redirect(buildEmailActivityHref({ ...params, page: pageCount }))
  }

  return (
    <UrlStateProvider
      pathname={EMAIL_ACTIVITY_PATH}
      params={params}
      defaults={EMAIL_ACTIVITY_DEFAULTS}
    >
      <div className="@container space-y-6">
        <EmailActivityHeader />

        <div className="flex flex-col gap-3 @4xl:flex-row @4xl:items-center">
          <ListSearch
            placeholder="Subject or recipient email"
            label="Search emails"
            className="@4xl:max-w-xs"
          />
          <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center @4xl:ml-auto">
            <SenderFilter senders={senders} />
            <RangeFilter />
          </div>
        </div>

        <ListResults label="Sent emails">
          <EmailActivityTable
            items={items}
            resultKey={buildEmailActivityHref(params)}
            hasFilters={
              params.query !== "" ||
              params.member !== "all" ||
              params.range !== "all"
            }
          />
          {total > 0 ? (
            <ListPagination total={total} pageCount={pageCount} />
          ) : null}
        </ListResults>
      </div>
    </UrlStateProvider>
  )
}

export default EmailActivityPage
