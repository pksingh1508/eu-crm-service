import Link from "next/link"
import { MailX } from "lucide-react"

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

export type RecentEmail = {
  id: string
  created_at: string
  subject: string | null
  lead: { id: string; name: string; email: string | null } | null
}

export const RECENT_EMAILS_LIMIT = 8

const panel = {
  title: "Recent emails",
  description: "The latest emails you've sent",
  href: "/team/email"
}

const EmailRowContent = ({ email }: { email: RecentEmail }) => (
  <>
    <InitialsAvatar name={email.lead?.name ?? "?"} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">
        {email.lead?.name ?? "Unknown lead"}
      </p>
      <p className="truncate text-xs text-muted-foreground">
        {email.subject?.trim() || "(No subject)"}
      </p>
    </div>
    <RelativeTime
      date={email.created_at}
      className="shrink-0 text-xs text-muted-foreground"
    />
  </>
)

export const RecentEmails = ({
  emails,
  className
}: {
  emails: RecentEmail[]
  className?: string
}) => (
  <DashboardPanel {...panel} className={className}>
    <div
      className="motion-safe:animate-fade-in-up"
      style={{ animationDelay: "240ms" }}
    >
      {emails.length === 0 ? (
        <EmptyState
          icon={MailX}
          title="No emails yet"
          description="Emails you send to leads will show up here."
        />
      ) : (
        <ul className="divide-y">
          {emails.map((email) => (
            <li key={email.id}>
              {email.lead ? (
                <Link
                  href={`/team/leads/${email.lead.id}`}
                  className={cn(panelRowClassName, panelRowHoverClassName)}
                >
                  <EmailRowContent email={email} />
                </Link>
              ) : (
                <div className={panelRowClassName}>
                  <EmailRowContent email={email} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  </DashboardPanel>
)

export const RecentEmailsSkeleton = ({ className }: { className?: string }) => (
  <DashboardPanel {...panel} className={className}>
    <ul className="divide-y">
      {Array.from({ length: RECENT_EMAILS_LIMIT }, (_, index) => (
        <ListRowSkeleton key={index} />
      ))}
    </ul>
  </DashboardPanel>
)
