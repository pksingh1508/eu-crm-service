"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { buildLeadsHref, LEADS_PAGE_SIZES } from "@/lib/leads"
import { cn, formatNumber } from "@/lib/utils"

import { useLeadsNavigation } from "./leads-navigation"

// Always 7 slots: first, last, the current page with its neighbours, and "…"
// for the gaps, e.g. 1 … 4 5 6 … 407
const getPageItems = (page: number, pageCount: number) => {
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, index) => from + index)

  if (pageCount <= 7) return range(1, pageCount)
  if (page <= 4) return [...range(1, 5), "gap", pageCount]
  if (page >= pageCount - 3) {
    return [1, "gap", ...range(pageCount - 4, pageCount)]
  }
  return [1, "gap", page - 1, page, page + 1, "gap-end", pageCount]
}

const pageButtonClassName =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm tabular-nums transition-colors duration-150"

type PageLinkProps = {
  href: string
  label: string
  isCurrent?: boolean
  isDisabled?: boolean
  onSelect: () => void
  children: React.ReactNode
}

const PageLink = ({
  href,
  label,
  isCurrent = false,
  isDisabled = false,
  onSelect,
  children
}: PageLinkProps) => {
  if (isDisabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className={cn(pageButtonClassName, "text-muted-foreground/40")}
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      prefetch={false}
      scroll={false}
      aria-label={label}
      aria-current={isCurrent ? "page" : undefined}
      onNavigate={(event) => {
        // Go through the shared transition, so the list shows it's loading.
        // Opening in a new tab still uses the normal link.
        event.preventDefault()
        if (!isCurrent) onSelect()
      }}
      className={cn(
        pageButtonClassName,
        isCurrent
          ? "bg-primary font-medium text-primary-foreground"
          : "text-foreground/80 hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}

const LeadsPagination = ({
  total,
  pageCount
}: {
  total: number
  pageCount: number
}) => {
  const { params, committedParams, navigate, resultsRef } =
    useLeadsNavigation()
  const { page, pageSize } = params

  const goToPage = (target: number) => {
    // From the bottom of a long page, bring the top of the list back into view
    const results = resultsRef.current
    if (results && results.getBoundingClientRect().top < 0) {
      results.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    navigate({ page: target })
  }

  const linkTo = (target: number) => ({
    href: buildLeadsHref({ ...params, page: target }),
    isDisabled: target < 1 || target > pageCount,
    onSelect: () => goToPage(target)
  })

  const first = (committedParams.page - 1) * committedParams.pageSize + 1
  const last = Math.min(total, committedParams.page * committedParams.pageSize)

  return (
    <div className="flex flex-col gap-3 border-t px-5 py-3 @2xl:flex-row @2xl:items-center @2xl:justify-between">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing{" "}
        <span className="font-medium tabular-nums text-foreground">
          {formatNumber(first)}–{formatNumber(last)}
        </span>{" "}
        of{" "}
        <span className="font-medium tabular-nums text-foreground">
          {formatNumber(total)}
        </span>
      </p>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden @lg:inline">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              const size = Number(value)
              // Keep the first row that was on screen on the new page
              const firstRow =
                (committedParams.page - 1) * committedParams.pageSize
              navigate({ pageSize: size, page: Math.floor(firstRow / size) + 1 })
            }}
          >
            <SelectTrigger
              aria-label="Rows per page"
              className="h-8 w-[4.5rem] bg-background"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEADS_PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav aria-label="Pagination" className="flex items-center gap-1">
          <PageLink label="Previous page" {...linkTo(page - 1)}>
            <ChevronLeft className="size-4" />
          </PageLink>
          <span className="px-2 text-sm tabular-nums text-muted-foreground @2xl:hidden">
            {formatNumber(page)} / {formatNumber(pageCount)}
          </span>
          <div className="hidden items-center gap-1 @2xl:flex">
            {getPageItems(page, pageCount).map((item) =>
              typeof item === "number" ? (
                <PageLink
                  key={item}
                  label={`Page ${item}`}
                  isCurrent={item === page}
                  {...linkTo(item)}
                >
                  {formatNumber(item)}
                </PageLink>
              ) : (
                <span
                  key={item}
                  aria-hidden="true"
                  className="w-6 text-center text-sm text-muted-foreground"
                >
                  …
                </span>
              )
            )}
          </div>
          <PageLink label="Next page" {...linkTo(page + 1)}>
            <ChevronRight className="size-4" />
          </PageLink>
        </nav>
      </div>
    </div>
  )
}

export default LeadsPagination
