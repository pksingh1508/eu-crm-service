"use client"

import { ChevronRight } from "lucide-react"
import { useLinkStatus } from "next/link"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

// The arrow at the end of a lead's row. It turns into a spinner while the
// lead's page loads (only if that takes longer than a moment, so fast
// navigations don't flicker).
const LeadRowIndicator = () => {
  const { pending } = useLinkStatus()

  return (
    <span aria-hidden="true" className="relative block size-4">
      <ChevronRight
        className={cn(
          "size-4 text-muted-foreground/60 transition duration-200 group-hover:translate-x-0.5 group-hover:text-foreground",
          pending && "opacity-0 delay-150"
        )}
      />
      <Spinner
        aria-hidden="true"
        className={cn(
          // Only spins while it's shown
          "absolute inset-0 animate-none text-muted-foreground opacity-0 transition-opacity",
          pending && "animate-spin opacity-100 delay-150"
        )}
      />
    </span>
  )
}

export default LeadRowIndicator
