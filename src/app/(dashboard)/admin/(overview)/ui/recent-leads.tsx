import { formatDistanceToNowStrict } from "date-fns"
import { Inbox } from "lucide-react"

import LeadStatusBadge from "@/components/leads/lead-status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import {
  DashboardPanel,
  EmptyState,
  InitialsAvatar,
  panelRowClassName,
  panelRowHoverClassName
} from "./dashboard-panel"

type LeadRow = {
  id: string
  name: string
  email: string | null
  status: string
  created_at: string
}

export const RECENT_LEADS_LIMIT = 8

const panel = {
  title: "Recent leads",
  description: "The latest leads captured across your workspace",
  href: "/admin/leads"
}

export const RecentLeads = ({
  leads,
  className
}: {
  leads: LeadRow[]
  className?: string
}) => (
  <DashboardPanel {...panel} className={className}>
    <div
      className="motion-safe:animate-fade-in-up"
      style={{ animationDelay: "240ms" }}
    >
      {leads.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No leads yet"
          description="New leads will appear here as soon as they're captured."
        />
      ) : (
        <ul className="divide-y">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className={cn(panelRowClassName, panelRowHoverClassName)}
            >
              <InitialsAvatar name={lead.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{lead.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {lead.email ?? "No email"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <LeadStatusBadge status={lead.status} />
                <time
                  dateTime={lead.created_at}
                  className="text-xs text-muted-foreground"
                >
                  {formatDistanceToNowStrict(new Date(lead.created_at), {
                    addSuffix: true
                  })}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </DashboardPanel>
)

export const RecentLeadsSkeleton = ({ className }: { className?: string }) => (
  <DashboardPanel {...panel} className={className}>
    <ul className="divide-y">
      {Array.from({ length: RECENT_LEADS_LIMIT }, (_, index) => (
        <li key={index} className={panelRowClassName}>
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-32" />
            </div>
            <div className="flex h-4 items-center">
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Skeleton className="h-5.5 w-16 rounded-full" />
            <div className="flex h-4 items-center">
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  </DashboardPanel>
)
