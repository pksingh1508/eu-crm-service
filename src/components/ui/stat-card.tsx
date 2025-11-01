"use client"

import { cn } from "@/lib/utils"

type StatCardProps = {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    direction: "up" | "down" | "neutral"
    value: string
  }
  className?: string
  icon?: React.ReactNode
}

const trendColor: Record<Required<StatCardProps>["trend"]["direction"], string> =
  {
    up: "text-emerald-600",
    down: "text-rose-600",
    neutral: "text-slate-500"
  }

const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  className,
  icon
}: StatCardProps) => {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/90 text-white">
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        {subtitle ?? ""}
        {trend ? (
          <span className={cn("font-medium", trendColor[trend.direction])}>
            {trend.value}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default StatCard

