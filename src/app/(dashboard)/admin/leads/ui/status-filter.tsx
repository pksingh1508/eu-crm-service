"use client"

import { getLeadStatusLabel, type LeadStatusFilter } from "@/lib/leads"
import { cn, formatNumber } from "@/lib/utils"

import { useLeadsNavigation } from "./leads-navigation"

const tabs: { value: LeadStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: getLeadStatusLabel("new") },
  { value: "email-send", label: getLeadStatusLabel("email-send") }
]

const StatusFilter = ({
  counts
}: {
  counts: Record<LeadStatusFilter, number>
}) => {
  const { params, navigate } = useLeadsNavigation()

  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="flex w-full shrink-0 gap-1 overflow-x-auto rounded-lg border bg-muted/60 p-1 @3xl:w-auto"
    >
      {tabs.map((tab) => {
        const isActive = params.status === tab.value

        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              if (!isActive) navigate({ status: tab.value, page: 1 })
            }}
            className={cn(
              "inline-flex h-8 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-200 @3xl:flex-none",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] leading-[18px] tabular-nums transition-colors duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/[0.07] text-muted-foreground"
              )}
            >
              {formatNumber(counts[tab.value])}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default StatusFilter
