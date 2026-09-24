import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type TrendDirection = "up" | "down" | "neutral"

type StatCardProps = {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    direction: TrendDirection
    value: string
  }
  className?: string
  style?: React.CSSProperties
  icon?: React.ReactNode
}

const trendIcon: Record<TrendDirection, typeof ArrowUpRight> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: Minus
}

const trendBadge: Record<TrendDirection, string> = {
  up: "bg-primary text-primary-foreground",
  down: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground"
}

const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  className,
  style,
  icon
}: StatCardProps) => {
  const TrendIcon = trend ? trendIcon[trend.direction] : null

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card p-5 text-card-foreground shadow-xs transition-[translate,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md",
        className
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="pt-1 text-sm font-medium text-muted-foreground">
          {title}
        </p>
        {icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground [&_svg]:size-4">
            {icon}
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {subtitle ? (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
      {trend && TrendIcon ? (
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full",
                trendBadge[trend.direction]
              )}
            >
              <TrendIcon className="size-3" />
            </span>
            <span className="truncate">{trend.value}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// Same size as a StatCard with an icon, subtitle and trend
export const StatCardSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "flex flex-col rounded-xl border bg-card p-5 shadow-xs",
      className
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <Skeleton className="mt-1.5 h-3.5 w-24" />
      <Skeleton className="size-9 rounded-lg" />
    </div>
    <div className="mt-2 flex h-9 items-center">
      <Skeleton className="h-7 w-20" />
    </div>
    <div className="mt-1 flex h-4 items-center">
      <Skeleton className="h-3 w-32" />
    </div>
    <div className="mt-auto pt-4">
      <div className="flex items-center gap-2 border-t pt-4">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  </div>
)

export default StatCard
