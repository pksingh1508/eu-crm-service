import { formatDistanceToNowStrict } from "date-fns"

const utcDateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC"
})

// "5 minutes ago". Only use this on the server: "now" differs in the browser,
// which would make the page flicker when it loads.
export const formatTimeAgo = (date: string | Date) =>
  formatDistanceToNowStrict(new Date(date), { addSuffix: true })

// "24 Sept 2026, 08:30 UTC": the exact time, the same for every viewer
export const formatUtcDateTime = (date: string | Date) =>
  `${utcDateTime.format(new Date(date))} UTC`
