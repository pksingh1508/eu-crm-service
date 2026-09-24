import Link from "next/link"
import { ChevronRight, CircleCheck } from "lucide-react"

import {
  DashboardPanel,
  panelRowClassName,
  panelRowHoverClassName
} from "@/components/dashboard/dashboard-panel"
import EmptyState from "@/components/ui/empty-state"
import InitialsAvatar from "@/components/ui/initials-avatar"
import RelativeTime from "@/components/ui/relative-time"
import { cn } from "@/lib/utils"

import ListRowSkeleton from "./list-row-skeleton"

export type QueuedLead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  updated_at: string
}

export const LEADS_QUEUE_LIMIT = 8

const panel = {
  title: "Leads to email",
  description: "New leads waiting for a first email",
  href: "/team/leads?status=new"
}

export const LeadsQueue = ({
  leads,
  className
}: {
  leads: QueuedLead[]
  className?: string
}) => (
  <DashboardPanel {...panel} className={className}>
    <div
      className="motion-safe:animate-fade-in-up"
      style={{ animationDelay: "180ms" }}
    >
      {leads.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          title="All caught up"
          description="There are no new leads waiting right now."
        />
      ) : (
        <ul className="divide-y">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link
                // "Back" on the lead page returns to the new leads
                href={`/team/leads/${lead.id}?returnTo=${encodeURIComponent(panel.href)}`}
                className={cn(
                  panelRowClassName,
                  panelRowHoverClassName,
                  "group"
                )}
              >
                <InitialsAvatar name={lead.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{lead.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.email ?? lead.phone ?? "No contact details"}
                  </p>
                </div>
                <RelativeTime
                  date={lead.updated_at}
                  className="shrink-0 text-xs text-muted-foreground"
                />
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  </DashboardPanel>
)

export const LeadsQueueSkeleton = ({ className }: { className?: string }) => (
  <DashboardPanel {...panel} className={className}>
    <ul className="divide-y">
      {Array.from({ length: LEADS_QUEUE_LIMIT }, (_, index) => (
        <ListRowSkeleton key={index} />
      ))}
    </ul>
  </DashboardPanel>
)
