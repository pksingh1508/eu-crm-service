import { formatTimeAgo, formatUtcDateTime } from "@/lib/dates"
import { cn } from "@/lib/utils"

// "5 minutes ago", with the exact time on hover. Only render this on the
// server: "now" differs between the server and the browser.
const RelativeTime = ({
  date,
  className
}: {
  date: string
  className?: string
}) => (
  <time
    dateTime={date}
    title={formatUtcDateTime(date)}
    className={cn("whitespace-nowrap", className)}
  >
    {formatTimeAgo(date)}
  </time>
)

export default RelativeTime
