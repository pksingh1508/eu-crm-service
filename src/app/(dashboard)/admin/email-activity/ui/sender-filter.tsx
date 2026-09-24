"use client"

import { UserRound } from "lucide-react"

import { useUrlState } from "@/components/list/url-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import type { EmailActivitySearchParams } from "@/lib/email-activity"
import type { SenderOption } from "@/server/email-activity/queries"

const SenderFilter = ({ senders }: { senders: SenderOption[] }) => {
  const { params, navigate } = useUrlState<EmailActivitySearchParams>()

  return (
    <Select
      value={params.member}
      onValueChange={(member) => navigate({ member, page: 1 })}
    >
      <SelectTrigger
        aria-label="Filter by sender"
        className="h-9 w-full bg-background @xl:w-52"
      >
        {/* A div, as the trigger's own styles target direct <span> children */}
        <div className="flex min-w-0 items-center gap-2">
          <UserRound
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
          <SelectValue className="block truncate" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All senders</SelectItem>
        {senders.map((sender) => (
          <SelectItem key={sender.id} value={sender.id}>
            {sender.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default SenderFilter
