import { Mail } from "lucide-react"

import {
  DashboardPanel,
  panelRowClassName,
  panelRowHoverClassName
} from "@/components/dashboard/dashboard-panel"
import EmptyState from "@/components/ui/empty-state"
import InitialsAvatar from "@/components/ui/initials-avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type MemberActivity = {
  actorId: string
  count: number
  name: string
  email: string
}

const panel = {
  title: "Team activity",
  description: "Emails sent in the last 7 days",
  href: "/admin/email-activity"
}

export const TeamActivity = ({
  members,
  className
}: {
  members: MemberActivity[]
  className?: string
}) => {
  const topCount = Math.max(1, ...members.map((member) => member.count))

  return (
    <DashboardPanel {...panel} className={className}>
      <div
        className="motion-safe:animate-fade-in-up"
        style={{ animationDelay: "180ms" }}
      >
        {members.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No emails sent yet"
            description="Emails your team sends will show up here."
          />
        ) : (
          <ul className="divide-y">
            {members.map((member, index) => (
              <li
                key={member.actorId}
                className={cn(panelRowClassName, panelRowHoverClassName)}
              >
                <InitialsAvatar name={member.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium">
                      {member.name}
                    </p>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">
                      {member.count.toLocaleString()}
                    </p>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full origin-left rounded-full bg-primary motion-safe:animate-grow-x"
                      style={{
                        width: `${(member.count / topCount) * 100}%`,
                        animationDelay: `${300 + index * 60}ms`
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardPanel>
  )
}

export const TeamActivitySkeleton = ({ className }: { className?: string }) => (
  <DashboardPanel {...panel} className={className}>
    <ul className="divide-y">
      {Array.from({ length: 4 }, (_, index) => (
        <li key={index} className={panelRowClassName}>
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex h-5 items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-6" />
            </div>
            <div className="flex h-4 items-center">
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  </DashboardPanel>
)
