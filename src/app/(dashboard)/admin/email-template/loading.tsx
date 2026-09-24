import { Skeleton } from "@/components/ui/skeleton"

import EmailTemplatesHeader from "./ui/email-templates-header"

// Shown right away when opening Email templates, while the templates load
const EmailTemplatesLoading = () => (
  <div className="@container space-y-6">
    <EmailTemplatesHeader />
    <p role="status" className="sr-only">
      Loading email templates…
    </p>

    <div className="grid items-start gap-6 @5xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="space-y-2 border-b px-5 py-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3.5 w-64 max-w-full" />
        </div>
        <div className="grid gap-5 p-5">
          <div className="grid gap-5 @2xl:grid-cols-2">
            {[0, 1].map((field) => (
              <div key={field} className="grid gap-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-[424px] w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <div className="flex items-center justify-between border-t px-5 py-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="space-y-2 border-b px-5 py-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3.5 w-44" />
        </div>
        <ul className="divide-y">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="flex items-start gap-3 px-5 py-4">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3.5 w-44 max-w-full" />
                <Skeleton className="h-3 w-36" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)

export default EmailTemplatesLoading
