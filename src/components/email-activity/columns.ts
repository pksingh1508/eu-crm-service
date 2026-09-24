import { cn } from "@/lib/utils"

// Shared by the table and its loading skeleton. On narrow screens only the
// Email column shows (with the lead and time inside it); the others appear as
// the content area gets wider.
export const columns = {
  lead: "hidden @2xl:table-cell",
  sender: "hidden @4xl:table-cell",
  sent: "hidden text-right @2xl:table-cell"
}

export const headCellClassName =
  "h-10 whitespace-nowrap px-5 text-left align-middle text-xs font-medium text-muted-foreground"
export const cellClassName = "px-5 py-3 align-middle"
// The Email column takes whatever width is left; long subjects and previews
// are cut off with "…" instead of stretching the table
export const emailCellClassName = cn(cellClassName, "w-full max-w-0")
