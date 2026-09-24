"use client"

import { TriangleAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useEffect } from "react"

import { Button } from "@/components/ui/button"
import EmptyState from "@/components/ui/empty-state"

import TeamLeadsHeader from "./ui/team-leads-header"

const TeamLeadsError = ({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) => {
  const router = useRouter()

  useEffect(() => {
    console.error("[team-leads] failed to load leads", error)
  }, [error])

  return (
    <div className="space-y-6">
      <TeamLeadsHeader />
      <div className="rounded-xl border bg-card shadow-xs">
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load leads"
          description="Something went wrong while loading your leads. Please try again."
          className="py-20"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              // Fetch the page again from the server, then re-render it
              startTransition(() => {
                router.refresh()
                reset()
              })
            }
          >
            Try again
          </Button>
        </EmptyState>
      </div>
    </div>
  )
}

export default TeamLeadsError
