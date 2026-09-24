"use client"

import { cn } from "@/lib/utils"

import { useUrlState } from "./url-state"

// The card around a list. While the next rows load, the current ones dim and
// a thin bar runs along the top (only if it takes more than a moment).
const ListResults = ({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) => {
  const { isPending, resultsRef } = useUrlState()

  return (
    <section
      ref={resultsRef}
      aria-label={label}
      aria-busy={isPending}
      className="relative scroll-mt-20 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs"
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden opacity-0 transition-opacity duration-200",
          isPending && "opacity-100 delay-150"
        )}
      >
        <div className="h-full w-1/3 rounded-full bg-primary motion-safe:animate-progress" />
      </div>
      <div
        className={cn(
          "transition-opacity duration-200",
          isPending && "pointer-events-none opacity-50 delay-150"
        )}
      >
        {children}
      </div>
    </section>
  )
}

export default ListResults
