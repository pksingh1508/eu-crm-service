import { getLeadStatusLabel } from "@/lib/leads"
import { cn } from "@/lib/utils"

const LeadStatusBadge = ({
  status,
  className
}: {
  status: string | null
  className?: string
}) => {
  const isNew = status === "new"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        isNew
          ? "border-transparent bg-primary text-primary-foreground"
          : "bg-background text-foreground/80",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          isNew ? "bg-primary-foreground" : "bg-foreground/40"
        )}
      />
      {getLeadStatusLabel(status)}
    </span>
  )
}

export default LeadStatusBadge
