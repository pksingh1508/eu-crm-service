import { EmailActivityTableSkeleton } from "@/components/email-activity/email-activity-table"
import { Skeleton } from "@/components/ui/skeleton"

import TeamEmailHeader from "./ui/team-email-header"

// Shown right away when opening Email center, while the first page loads.
// Later searches and page changes keep the current rows on screen instead.
const EmailCenterLoading = () => (
  <div className="@container space-y-6">
    <TeamEmailHeader />
    <p role="status" className="sr-only">
      Loading your emails…
    </p>

    <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
      <Skeleton className="h-9 w-full @3xl:max-w-sm" />
      <Skeleton className="h-[42px] w-full rounded-lg @3xl:w-80" />
    </div>

    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <EmailActivityTableSkeleton scope="own" />
      <div className="flex items-center justify-between gap-4 border-t px-5 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  </div>
)

export default EmailCenterLoading
