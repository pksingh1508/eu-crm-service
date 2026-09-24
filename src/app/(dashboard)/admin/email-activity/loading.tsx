import { EmailActivityTableSkeleton } from "@/components/email-activity/email-activity-table"
import { Skeleton } from "@/components/ui/skeleton"

import EmailActivityHeader from "./ui/email-activity-header"

// Shown right away when opening Email activity, while the first page loads.
// Later searches and page changes keep the current rows on screen instead.
const EmailActivityLoading = () => (
  <div className="@container space-y-6">
    <EmailActivityHeader />
    <p role="status" className="sr-only">
      Loading email activity…
    </p>

    <div className="flex flex-col gap-3 @4xl:flex-row @4xl:items-center">
      <Skeleton className="h-9 w-full @4xl:max-w-xs" />
      <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center @4xl:ml-auto">
        <Skeleton className="h-9 w-full @xl:w-52" />
        <Skeleton className="h-[42px] w-full rounded-lg @xl:w-80" />
      </div>
    </div>

    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <EmailActivityTableSkeleton />
      <div className="flex items-center justify-between gap-4 border-t px-5 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  </div>
)

export default EmailActivityLoading
