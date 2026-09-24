import { Skeleton } from "@/components/ui/skeleton"

import TeamLeadsHeader from "./ui/team-leads-header"
import { TeamLeadsListSkeleton } from "./ui/team-leads-list"

// Shown right away when opening My leads, while the first page of leads loads.
// Later searches and page changes keep the current rows on screen instead. It
// lives in the (list) route group so it doesn't apply to a lead's own page.
const TeamLeadsLoading = () => (
  <div className="@container space-y-6">
    <TeamLeadsHeader />
    <p role="status" className="sr-only">
      Loading leads…
    </p>

    <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
      <Skeleton className="h-9 w-full @3xl:max-w-sm" />
      <Skeleton className="h-[42px] w-full rounded-lg @3xl:w-80" />
    </div>

    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <TeamLeadsListSkeleton />
      <div className="flex items-center justify-between gap-4 border-t px-5 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  </div>
)

export default TeamLeadsLoading
