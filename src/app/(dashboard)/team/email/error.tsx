"use client"

import { TriangleAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useEffect } from "react"

import { Button } from "@/components/ui/button"
import EmptyState from "@/components/ui/empty-state"

import TeamEmailHeader from "./ui/team-email-header"

const EmailCenterError = ({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) => {
  const router = useRouter()

  useEffect(() => {
    console.error("[email-center] failed to load emails", error)
  }, [error])

  return (
    <div className="space-y-6">
      <TeamEmailHeader />
      <div className="rounded-xl border bg-card shadow-xs">
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load your emails"
          description="Something went wrong while loading the emails you've sent. Please try again."
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

export default EmailCenterError
