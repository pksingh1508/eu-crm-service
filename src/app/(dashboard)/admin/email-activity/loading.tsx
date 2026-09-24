import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import {
  cellClassName,
  columns,
  emailCellClassName
} from "./ui/columns"
import EmailActivityHeader from "./ui/email-activity-header"
import { EmailActivityTableHead } from "./ui/email-activity-table"

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
      <table className="w-full text-sm">
        <EmailActivityTableHead />
        <tbody>
          {Array.from({ length: 12 }, (_, index) => (
            <tr key={index} className="border-b last:border-b-0">
              <td className={cn(cellClassName, columns.lead)}>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div>
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3.5 w-28" />
                    </div>
                    <div className="flex h-4 items-center">
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                </div>
              </td>
              <td className={emailCellClassName}>
                <div className="flex items-start gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full @2xl:hidden" />
                  <div className="min-w-0 flex-1">
                    <div className="flex h-5 items-center @2xl:hidden">
                      <Skeleton className="h-3.5 w-28 max-w-full" />
                    </div>
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3.5 w-56 max-w-full" />
                    </div>
                    <div className="flex h-4 items-center">
                      <Skeleton className="h-3 w-80 max-w-full" />
                    </div>
                  </div>
                </div>
              </td>
              <td className={cn(cellClassName, columns.sender)}>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </td>
              <td className={cn(cellClassName, columns.sent)}>
                <Skeleton className="ml-auto h-3.5 w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between gap-4 border-t px-5 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  </div>
)

export default EmailActivityLoading
