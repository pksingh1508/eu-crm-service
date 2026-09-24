import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  children?: React.ReactNode
  className?: string
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  children,
  className
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
      className
    )}
  >
    <div className="flex size-11 items-center justify-center rounded-full border bg-muted/60">
      <Icon className="size-5 text-muted-foreground" />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {children}
  </div>
)

export default EmptyState
