"use client"

import { TriangleAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useEffect } from "react"

import { Button } from "@/components/ui/button"
import EmptyState from "@/components/ui/empty-state"

import EmailActivityHeader from "./ui/email-activity-header"

const EmailActivityError = ({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) => {
  const router = useRouter()

  useEffect(() => {
    console.error("[admin-email-activity] failed to load", error)
  }, [error])

  return (
    <div className="space-y-6">
      <EmailActivityHeader />
      <div className="rounded-xl border bg-card shadow-xs">
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load email activity"
          description="Something went wrong while loading sent emails. Please try again."
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

export default EmailActivityError
