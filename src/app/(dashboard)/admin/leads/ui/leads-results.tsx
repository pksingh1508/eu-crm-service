"use client"

import { cn } from "@/lib/utils"

import { useLeadsNavigation } from "./leads-navigation"

// The card around the table. While the next rows load, the current ones dim
// and a thin bar runs along the top (only if it takes more than a moment).
const LeadsResults = ({ children }: { children: React.ReactNode }) => {
  const { isPending, resultsRef } = useLeadsNavigation()

  return (
    <section
      ref={resultsRef}
      aria-label="Leads"
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

export default LeadsResults
