import { Inbox, SearchX } from "lucide-react"
import { Fragment } from "react"

import LeadStatusBadge from "@/components/leads/lead-status-badge"
import ClearFiltersButton from "@/components/list/clear-filters-button"
import EmptyState from "@/components/ui/empty-state"
import InitialsAvatar from "@/components/ui/initials-avatar"
import RelativeTime from "@/components/ui/relative-time"
import { Skeleton } from "@/components/ui/skeleton"
import { getLeadStatusLabel, type LeadStatusFilter } from "@/lib/leads"
import { cn, formatNumber } from "@/lib/utils"
import type { LeadListItem } from "@/server/leads/queries"

// On narrow screens only the Lead column shows, with the status and date
// inside it; the other columns appear as the content area gets wider.
const columns = {
  phone: "hidden @3xl:table-cell",
  status: "hidden @2xl:table-cell",
  sentBy: "hidden @5xl:table-cell",
  added: "hidden text-right @2xl:table-cell"
}

const headCellClassName =
  "h-10 whitespace-nowrap px-5 text-left align-middle text-xs font-medium text-muted-foreground"
const cellClassName = "px-5 py-3 align-middle"
// The Lead column takes whatever width is left; long names and emails are cut
// off with "…" instead of stretching the table
const leadCellClassName = cn(cellClassName, "w-full max-w-0")

type StatusGroup = "new" | "email-send" | "other"

const statusGroupOf = (status: string | null): StatusGroup =>
  status === "new" || status === "email-send" ? status : "other"

const groupLabels: Record<StatusGroup, string> = {
  new: getLeadStatusLabel("new"),
  "email-send": getLeadStatusLabel("email-send"),
  other: "Other statuses"
}

const LeadsTableHead = () => (
  <thead className="hidden border-b bg-muted/40 @2xl:table-header-group">
    <tr>
      <th scope="col" className={headCellClassName}>
        Lead
      </th>
      <th scope="col" className={cn(headCellClassName, columns.phone)}>
        Phone
      </th>
      <th scope="col" className={cn(headCellClassName, columns.status)}>
        Status
      </th>
      <th scope="col" className={cn(headCellClassName, columns.sentBy)}>
        Sent by
      </th>
      <th scope="col" className={cn(headCellClassName, columns.added)}>
        Added
      </th>
    </tr>
  </thead>
)

const StatusGroupRow = ({ label, count }: { label: string; count: number }) => (
  <tr className="border-b bg-muted/30 motion-safe:animate-fade-in">
    <th
      colSpan={5}
      scope="colgroup"
      className="px-5 py-2 text-left text-xs font-medium text-muted-foreground"
    >
      {label}{" "}
      <span className="tabular-nums text-muted-foreground/70">
        · {formatNumber(count)}
      </span>
    </th>
  </tr>
)

const LeadRow = ({ lead, index }: { lead: LeadListItem; index: number }) => (
  <tr
    className="border-b transition-colors duration-150 last:border-b-0 hover:bg-muted/40 motion-safe:animate-fade-in"
    // The first rows fade in one after another
    style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
  >
    <td className={leadCellClassName}>
      <div className="flex items-center gap-3">
        <InitialsAvatar name={lead.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{lead.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {lead.email ?? "No email"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 @2xl:hidden">
          <LeadStatusBadge status={lead.status} />
          <RelativeTime
            date={lead.created_at}
            className="text-xs text-muted-foreground"
          />
        </div>
      </div>
    </td>
    <td
      className={cn(
        cellClassName,
        columns.phone,
        "whitespace-nowrap tabular-nums text-foreground/80"
      )}
    >
      {lead.phone ?? "—"}
    </td>
    <td className={cn(cellClassName, columns.status)}>
      <LeadStatusBadge status={lead.status} />
    </td>
    <td className={cn(cellClassName, columns.sentBy)}>
      <span className="block max-w-48 truncate text-foreground/80">
        {lead.send_by ?? "—"}
      </span>
    </td>
    <td className={cn(cellClassName, columns.added)}>
      <RelativeTime date={lead.created_at} className="text-muted-foreground" />
    </td>
  </tr>
)

type LeadsTableProps = {
  leads: LeadListItem[]
  // Changes with every new result, so the rows fade in again
  resultKey: string
  statusCounts: Record<LeadStatusFilter, number>
  showStatusGroups: boolean
  hasFilters: boolean
}

const LeadsTable = ({
  leads,
  resultKey,
  statusCounts,
  showStatusGroups,
  hasFilters
}: LeadsTableProps) => {
  if (leads.length === 0) {
    return hasFilters ? (
      <EmptyState
        icon={SearchX}
        title="No leads match your filters"
        description="Try another search or status."
      >
        <ClearFiltersButton />
      </EmptyState>
    ) : (
      <EmptyState
        icon={Inbox}
        title="No leads yet"
        description="New leads will appear here as soon as they're captured."
      />
    )
  }

  const groupCounts: Record<StatusGroup, number> = {
    new: statusCounts.new,
    "email-send": statusCounts["email-send"],
    other: statusCounts.all - statusCounts.new - statusCounts["email-send"]
  }

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Leads, with new leads first</caption>
      <LeadsTableHead />
      <tbody key={resultKey}>
        {leads.map((lead, index) => {
          const group = statusGroupOf(lead.status)
          const startsGroup =
            showStatusGroups &&
            (index === 0 || statusGroupOf(leads[index - 1].status) !== group)

          return (
            <Fragment key={lead.id}>
              {startsGroup ? (
                <StatusGroupRow
                  label={groupLabels[group]}
                  count={groupCounts[group]}
                />
              ) : null}
              <LeadRow lead={lead} index={index} />
            </Fragment>
          )
        })}
      </tbody>
    </table>
  )
}

export const LeadsTableSkeleton = () => (
  <table className="w-full text-sm">
    <LeadsTableHead />
    <tbody>
      {Array.from({ length: 12 }, (_, index) => (
        <tr key={index} className="border-b last:border-b-0">
          <td className={leadCellClassName}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex h-5 items-center">
                  <Skeleton className="h-3.5 w-36 max-w-full" />
                </div>
                <div className="flex h-4 items-center">
                  <Skeleton className="h-3 w-48 max-w-full" />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 @2xl:hidden">
                <Skeleton className="h-5.5 w-16 rounded-full" />
                <div className="flex h-4 items-center">
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          </td>
          <td className={cn(cellClassName, columns.phone)}>
            <Skeleton className="h-3.5 w-24" />
          </td>
          <td className={cn(cellClassName, columns.status)}>
            <Skeleton className="h-5.5 w-16 rounded-full" />
          </td>
          <td className={cn(cellClassName, columns.sentBy)}>
            <Skeleton className="h-3.5 w-32" />
          </td>
          <td className={cn(cellClassName, columns.added)}>
            <Skeleton className="ml-auto h-3.5 w-20" />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

export default LeadsTable
