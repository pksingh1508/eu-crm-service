import Link from "next/link"
import { CircleCheck, Inbox, MailX, SearchX } from "lucide-react"

import LeadStatusBadge from "@/components/leads/lead-status-badge"
import ClearFiltersButton from "@/components/list/clear-filters-button"
import EmptyState from "@/components/ui/empty-state"
import InitialsAvatar from "@/components/ui/initials-avatar"
import RelativeTime from "@/components/ui/relative-time"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getLeadStatusLabel,
  TEAM_LEADS_PATH,
  type LeadStatusFilter
} from "@/lib/leads"
import { cn, formatNumber } from "@/lib/utils"
import type { TeamLeadListItem } from "@/server/leads/queries"

import LeadRowIndicator from "./lead-row-indicator"

// Each row is a link to the lead, on the same grid as the header. On narrow
// screens only the Lead column shows, with the status and time inside it;
// the other columns appear as the content area gets wider.
const gridClassName =
  "grid grid-cols-[minmax(0,1fr)_1rem] items-center gap-x-4 px-5 @2xl:grid-cols-[minmax(0,1fr)_6.5rem_7.5rem_1rem] @2xl:gap-x-6 @3xl:grid-cols-[minmax(0,1fr)_9rem_6.5rem_7.5rem_1rem]"

const columns = {
  phone: "hidden @3xl:block",
  status: "hidden @2xl:block",
  updated: "hidden text-right @2xl:block"
}

// The rows are links that already say what they are, so this is only visual
const TeamLeadsListHead = () => (
  <div
    aria-hidden="true"
    className={cn(
      gridClassName,
      "hidden h-10 whitespace-nowrap bg-muted/40 text-xs font-medium text-muted-foreground @2xl:grid"
    )}
  >
    <span>Lead</span>
    <span className={columns.phone}>Phone</span>
    <span className={columns.status}>Status</span>
    <span className={columns.updated}>Updated</span>
  </div>
)

const StatusGroupHeading = ({
  status,
  count
}: {
  status: string
  count: number
}) => (
  <h2 className="bg-muted/30 px-5 py-2 text-xs font-medium text-muted-foreground motion-safe:animate-fade-in">
    {getLeadStatusLabel(status)}{" "}
    <span className="tabular-nums text-muted-foreground/70">
      · {formatNumber(count)}
    </span>
  </h2>
)

const LeadRow = ({
  lead,
  href,
  index
}: {
  lead: TeamLeadListItem
  href: string
  index: number
}) => (
  <li>
    <Link
      href={href}
      // There are many rows; a lead's page loads when it's opened, and the
      // row's arrow shows it's loading
      prefetch={false}
      className={cn(
        gridClassName,
        "group py-3 outline-none transition-colors duration-150 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-safe:animate-fade-in"
      )}
      // The first rows fade in one after another
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
    >
      <div className="flex min-w-0 items-center gap-3">
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
            date={lead.updated_at}
            className="text-xs text-muted-foreground"
          />
        </div>
      </div>
      <span
        className={cn(
          columns.phone,
          "truncate tabular-nums text-foreground/80"
        )}
      >
        {lead.phone ?? "—"}
      </span>
      <span className={columns.status}>
        <LeadStatusBadge status={lead.status} />
      </span>
      <RelativeTime
        date={lead.updated_at}
        className={cn(columns.updated, "text-muted-foreground")}
      />
      <LeadRowIndicator />
    </Link>
  </li>
)

const TeamLeadsEmptyState = ({
  query,
  status
}: {
  query: string
  status: LeadStatusFilter
}) => {
  if (query) {
    return (
      <EmptyState
        icon={SearchX}
        title="No leads match your search"
        description="Try another name, email, phone or company."
      >
        <ClearFiltersButton />
      </EmptyState>
    )
  }

  if (status === "new") {
    return (
      <EmptyState
        icon={CircleCheck}
        title="All caught up"
        description="There are no new leads waiting right now."
      />
    )
  }

  if (status === "email-send") {
    return (
      <EmptyState
        icon={MailX}
        title="No emails sent yet"
        description="Leads you email will show up here."
      />
    )
  }

  return (
    <EmptyState
      icon={Inbox}
      title="No leads yet"
      description="New leads will show up here as soon as they come in."
    />
  )
}

type TeamLeadsListProps = {
  leads: TeamLeadListItem[]
  // The address of these results. "Back" on a lead's page returns here, and a
  // new address makes the rows fade in again.
  listHref: string
  statusCounts: Record<LeadStatusFilter, number>
  query: string
  status: LeadStatusFilter
}

const TeamLeadsList = ({
  leads,
  listHref,
  statusCounts,
  query,
  status
}: TeamLeadsListProps) => {
  if (leads.length === 0) {
    return <TeamLeadsEmptyState query={query} status={status} />
  }

  const leadHref = (leadId: string) =>
    listHref === TEAM_LEADS_PATH
      ? `${TEAM_LEADS_PATH}/${leadId}`
      : `${TEAM_LEADS_PATH}/${leadId}?returnTo=${encodeURIComponent(listHref)}`

  // New leads come first, so a page has at most two groups
  const newLeads = leads.filter((lead) => lead.status === "new")
  const groups = [
    { status: "new", leads: newLeads, firstIndex: 0 },
    {
      status: "email-send",
      leads: leads.filter((lead) => lead.status !== "new"),
      firstIndex: newLeads.length
    }
  ] as const

  return (
    <div key={listHref} className="divide-y text-sm">
      <TeamLeadsListHead />
      {groups.map((group) =>
        group.leads.length > 0 ? (
          <div key={group.status} className="divide-y">
            {status === "all" ? (
              <StatusGroupHeading
                status={group.status}
                count={statusCounts[group.status]}
              />
            ) : null}
            <ul className="divide-y">
              {group.leads.map((lead, index) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  href={leadHref(lead.id)}
                  index={group.firstIndex + index}
                />
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  )
}

export const TeamLeadsListSkeleton = () => (
  <div className="divide-y">
    <TeamLeadsListHead />
    <ul className="divide-y">
      {Array.from({ length: 12 }, (_, index) => (
        <li key={index} className={cn(gridClassName, "py-3")}>
          <div className="flex min-w-0 items-center gap-3">
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
          <Skeleton className={cn(columns.phone, "h-3.5 w-24")} />
          <div className={columns.status}>
            <Skeleton className="h-5.5 w-16 rounded-full" />
          </div>
          <div className={columns.updated}>
            <Skeleton className="ml-auto h-3.5 w-20" />
          </div>
        </li>
      ))}
    </ul>
  </div>
)

export default TeamLeadsList
