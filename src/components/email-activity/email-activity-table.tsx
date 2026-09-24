"use client"

import { MailX, SearchX } from "lucide-react"
import { useState } from "react"

import ClearFiltersButton from "@/components/list/clear-filters-button"
import EmptyState from "@/components/ui/empty-state"
import InitialsAvatar from "@/components/ui/initials-avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { EmailActivityItem } from "@/server/email-activity/queries"

import {
  cellClassName,
  columns,
  emailCellClassName,
  headCellClassName
} from "./columns"
import EmailDetailsSheet from "./email-details-sheet"

// "all": everyone's emails, for admins. "own": a team member's own emails, so
// there's no Sent by column, and each email links to its lead.
export type EmailActivityScope = "all" | "own"

const emptyTexts: Record<
  EmailActivityScope,
  { filtered: string; none: string }
> = {
  all: {
    filtered: "Try another search, sender or date range.",
    none: "Emails your team sends to leads will show up here."
  },
  own: {
    filtered: "Try another search or date range.",
    none: "Emails you send to leads will show up here."
  }
}

export const EmailActivityTableHead = ({
  scope = "all"
}: {
  scope?: EmailActivityScope
}) => (
  <thead className="hidden border-b bg-muted/40 @2xl:table-header-group">
    <tr>
      <th scope="col" className={cn(headCellClassName, columns.lead)}>
        Lead
      </th>
      <th scope="col" className={headCellClassName}>
        Email
      </th>
      {scope === "all" ? (
        <th scope="col" className={cn(headCellClassName, columns.sender)}>
          Sent by
        </th>
      ) : null}
      <th scope="col" className={cn(headCellClassName, columns.sent)}>
        Sent
      </th>
    </tr>
  </thead>
)

const EmailRow = ({
  item,
  index,
  showSender,
  isActive,
  onOpen
}: {
  item: EmailActivityItem
  index: number
  showSender: boolean
  isActive: boolean
  onOpen: () => void
}) => (
  <tr
    onClick={onOpen}
    className={cn(
      "cursor-pointer border-b transition-colors duration-150 last:border-b-0 hover:bg-muted/40 motion-safe:animate-fade-in",
      isActive && "bg-muted/60 hover:bg-muted/60"
    )}
    // The first rows fade in one after another
    style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
  >
    <td className={cn(cellClassName, columns.lead)}>
      <div className="flex items-center gap-3">
        <InitialsAvatar name={item.lead.name} />
        <div className="min-w-0 max-w-40 @4xl:max-w-52">
          <p className="truncate font-medium">{item.lead.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.lead.email ?? "No email"}
          </p>
        </div>
      </div>
    </td>
    <td className={emailCellClassName}>
      <div className="flex items-start gap-3">
        <div className="@2xl:hidden">
          <InitialsAvatar name={item.lead.name} />
        </div>
        <div className="min-w-0 flex-1">
          {/* On narrow screens the lead and time columns are hidden */}
          <div className="flex items-baseline justify-between gap-3 @2xl:hidden">
            <p className="truncate font-medium">{item.lead.name}</p>
            <time
              dateTime={item.sentAt}
              title={item.sentAtExact}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {item.sentAtLabel}
            </time>
          </div>
          <button
            type="button"
            aria-haspopup="dialog"
            data-email-id={item.id}
            className="block w-full truncate rounded-sm text-left @2xl:font-medium"
          >
            {item.subject}
          </button>
          <p className="truncate text-xs text-muted-foreground">
            {item.preview || "No text version saved"}
          </p>
        </div>
      </div>
    </td>
    {showSender ? (
      <td className={cn(cellClassName, columns.sender)}>
        {item.sender ? (
          <div className="flex max-w-56 items-center gap-2">
            <InitialsAvatar name={item.sender.name} />
            <span className="truncate text-foreground/80">
              {item.sender.name}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">Unknown</span>
        )}
      </td>
    ) : null}
    <td className={cn(cellClassName, columns.sent)}>
      <time
        dateTime={item.sentAt}
        title={item.sentAtExact}
        className="whitespace-nowrap text-muted-foreground"
      >
        {item.sentAtLabel}
      </time>
    </td>
  </tr>
)

type EmailActivityTableProps = {
  items: EmailActivityItem[]
  // Changes with every new result, so the rows fade in again
  resultKey: string
  hasFilters: boolean
  scope?: EmailActivityScope
}

const EmailActivityTable = ({
  items,
  resultKey,
  hasFilters,
  scope = "all"
}: EmailActivityTableProps) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  if (items.length === 0) {
    return hasFilters ? (
      <EmptyState
        icon={SearchX}
        title="No emails match your filters"
        description={emptyTexts[scope].filtered}
      >
        <ClearFiltersButton />
      </EmptyState>
    ) : (
      <EmptyState
        icon={MailX}
        title="No emails sent yet"
        description={emptyTexts[scope].none}
      />
    )
  }

  // Kept while the panel slides out, so its content doesn't disappear early
  const activeIndex = items.findIndex((item) => item.id === activeId)
  const activeItem = activeIndex >= 0 ? items[activeIndex] : null

  return (
    <>
      <table className="w-full text-sm">
        <caption className="sr-only">Sent emails, newest first</caption>
        <EmailActivityTableHead scope={scope} />
        <tbody key={resultKey}>
          {items.map((item, index) => (
            <EmailRow
              key={item.id}
              item={item}
              index={index}
              showSender={scope === "all"}
              isActive={isOpen && item.id === activeId}
              onOpen={() => {
                setActiveId(item.id)
                setIsOpen(true)
              }}
            />
          ))}
        </tbody>
      </table>

      <EmailDetailsSheet
        item={activeItem}
        open={isOpen && activeItem !== null}
        onOpenChange={setIsOpen}
        onPrevious={
          activeIndex > 0
            ? () => setActiveId(items[activeIndex - 1].id)
            : undefined
        }
        onNext={
          activeIndex >= 0 && activeIndex < items.length - 1
            ? () => setActiveId(items[activeIndex + 1].id)
            : undefined
        }
        onCloseAutoFocus={(event) => {
          // Back to the row of the last email shown, for keyboard users
          event.preventDefault()
          document
            .querySelector<HTMLElement>(`[data-email-id="${activeId}"]`)
            ?.focus()
        }}
        showSender={scope === "all"}
        leadHref={
          scope === "own" && activeItem?.leadId
            ? `/team/leads/${activeItem.leadId}`
            : undefined
        }
      />
    </>
  )
}

export const EmailActivityTableSkeleton = ({
  scope = "all"
}: {
  scope?: EmailActivityScope
}) => (
  <table className="w-full text-sm">
    <EmailActivityTableHead scope={scope} />
    <tbody>
      {Array.from({ length: 12 }, (_, index) => (
        <tr key={index} className="border-b last:border-b-0">
          <td className={cn(cellClassName, columns.lead)}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              {/* As wide as a lead's email usually is, so the columns don't
                  move when the emails appear */}
              <div className="w-40 @4xl:w-52">
                <div className="flex h-5 items-center">
                  <Skeleton className="h-3.5 w-28" />
                </div>
                <div className="flex h-4 items-center">
                  <Skeleton className="h-3 w-36 @4xl:w-44" />
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
          {scope === "all" ? (
            <td className={cn(cellClassName, columns.sender)}>
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </td>
          ) : null}
          <td className={cn(cellClassName, columns.sent)}>
            <Skeleton className="ml-auto h-3.5 w-24" />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

export default EmailActivityTable
