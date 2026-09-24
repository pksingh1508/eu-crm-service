import { Skeleton } from "@/components/ui/skeleton"

import LeadsHeader from "./ui/leads-header"
import { LeadsTableSkeleton } from "./ui/leads-table"

// Shown right away when opening Leads, while the first page of leads loads.
// Later searches and page changes keep the current rows on screen instead.
const LeadsLoading = () => (
  <div className="@container space-y-6">
    <LeadsHeader />
    <p role="status" className="sr-only">
      Loading leads…
    </p>

    <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
      <Skeleton className="h-9 w-full @3xl:max-w-sm" />
      <Skeleton className="h-[42px] w-full rounded-lg @3xl:w-80" />
    </div>

    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <LeadsTableSkeleton />
      <div className="flex items-center justify-between gap-4 border-t px-5 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  </div>
)

export default LeadsLoading
