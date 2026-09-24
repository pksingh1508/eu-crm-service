import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DashboardPanelProps = {
  title: string
  description: string
  href: string
  children: React.ReactNode
  className?: string
}

export const DashboardPanel = ({
  title,
  description,
  href,
  children,
  className
}: DashboardPanelProps) => (
  <section
    className={cn(
      "flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs",
      className
    )}
  >
    <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
      <div className="min-w-0 space-y-1">
        <h2 className="text-base font-semibold leading-tight tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="group -mr-2 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <Link href={href}>
          View all
          <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </Button>
    </header>
    {children}
  </section>
)

export const panelRowClassName = "flex items-center gap-3 px-5 py-3.5"

// For rows with real data (not skeletons)
export const panelRowHoverClassName =
  "transition-colors duration-150 hover:bg-muted/40"
