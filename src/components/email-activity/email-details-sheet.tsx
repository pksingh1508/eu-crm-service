"use client"

import Link, { useLinkStatus } from "next/link"
import { ArrowRight, ChevronDown, ChevronUp, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import type { EmailActivityItem, Person } from "@/server/email-activity/queries"

const DetailRow = ({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) => (
  <>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </>
)

const PersonValue = ({
  person,
  fallback
}: {
  person: Person | null
  fallback: string
}) =>
  person ? (
    <>
      <span className="font-medium">{person.name}</span>
      {person.email && person.email !== person.name ? (
        <span className="block text-muted-foreground">{person.email}</span>
      ) : null}
    </>
  ) : (
    <span className="text-muted-foreground">{fallback}</span>
  )

// Turns into a spinner while the lead's page loads
const OpenLeadIcon = () => {
  const { pending } = useLinkStatus()

  return pending ? (
    <Spinner aria-hidden="true" />
  ) : (
    <ArrowRight aria-hidden="true" />
  )
}

type EmailDetailsSheetProps = {
  item: EmailActivityItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  // Missing at the start / end of the page
  onPrevious?: () => void
  onNext?: () => void
  onCloseAutoFocus?: (event: Event) => void
  showSender?: boolean
  // The lead's page, for a button that opens it
  leadHref?: string
}

// The full email, sliding in from the right when a row is clicked
const EmailDetailsSheet = ({
  item,
  open,
  onOpenChange,
  onPrevious,
  onNext,
  onCloseAutoFocus,
  showSender = true,
  leadHref
}: EmailDetailsSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent onCloseAutoFocus={onCloseAutoFocus}>
      {item ? (
        <>
          <div className="flex items-start gap-4 border-b px-6 py-4">
            <div className="min-w-0 flex-1 space-y-1">
              <SheetTitle className="break-words">{item.subject}</SheetTitle>
              <SheetDescription>
                Sent {item.sentAtLabel} · {item.sentAtExact}
              </SheetDescription>
            </div>
            <div className="-mr-2 flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous email"
                disabled={!onPrevious}
                onClick={onPrevious}
              >
                <ChevronUp />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next email"
                disabled={!onNext}
                onClick={onNext}
              >
                <ChevronDown />
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close">
                  <X />
                </Button>
              </SheetClose>
            </div>
          </div>

          {/* A new key per email, so it fades in when stepping through them */}
          <div
            key={item.id}
            className="flex-1 space-y-6 overflow-y-auto px-6 py-5 motion-safe:animate-fade-in"
          >
            <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
              <DetailRow label="To">
                <PersonValue person={item.lead} fallback="Unknown lead" />
              </DetailRow>
              {item.cc.length > 0 ? (
                <DetailRow label="Cc">{item.cc.join(", ")}</DetailRow>
              ) : null}
              {item.bcc.length > 0 ? (
                <DetailRow label="Bcc">{item.bcc.join(", ")}</DetailRow>
              ) : null}
              <DetailRow label="From">
                <PersonValue person={item.mailbox} fallback="Unknown mailbox" />
              </DetailRow>
              {showSender ? (
                <DetailRow label="Sent by">
                  <PersonValue person={item.sender} fallback="Unknown sender" />
                </DetailRow>
              ) : null}
            </dl>

            <div className="rounded-lg border bg-muted/30 px-4 py-3.5">
              {item.body ? (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {item.body}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No text version of this email was saved.
                </p>
              )}
            </div>
          </div>

          {leadHref ? (
            <div className="flex justify-end border-t px-6 py-3">
              <Button asChild variant="outline" size="sm">
                <Link href={leadHref}>
                  Open lead
                  <OpenLeadIcon />
                </Link>
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </SheetContent>
  </Sheet>
)

export default EmailDetailsSheet
