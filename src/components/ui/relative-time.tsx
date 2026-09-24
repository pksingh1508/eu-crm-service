import { formatDistanceToNowStrict } from "date-fns"

import { cn } from "@/lib/utils"

const utcDateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC"
})

// "5 minutes ago", with the exact time on hover. Only render this on the
// server: "now" differs between the server and the browser.
const RelativeTime = ({
  date,
  className
}: {
  date: string
  className?: string
}) => {
  const value = new Date(date)

  return (
    <time
      dateTime={date}
      title={`${utcDateTime.format(value)} UTC`}
      className={cn("whitespace-nowrap", className)}
    >
      {formatDistanceToNowStrict(value, { addSuffix: true })}
    </time>
  )
}

export default RelativeTime
