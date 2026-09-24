"use client"

import { cn, formatNumber } from "@/lib/utils"

type SegmentedControlProps<T extends string> = {
  label: string
  options: readonly { value: T; label: string; count?: number }[]
  value: T
  onValueChange: (value: T) => void
  className?: string
}

// A row of buttons where one is selected, e.g. status or date range filters
const SegmentedControl = <T extends string>({
  label,
  options,
  value,
  onValueChange,
  className
}: SegmentedControlProps<T>) => (
  <div
    role="group"
    aria-label={label}
    className={cn(
      "flex w-full shrink-0 gap-1 overflow-x-auto rounded-lg border bg-muted/60 p-1 @3xl:w-auto",
      className
    )}
  >
    {options.map((option) => {
      const isActive = option.value === value

      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={isActive}
          onClick={() => {
            if (!isActive) onValueChange(option.value)
          }}
          className={cn(
            "inline-flex h-8 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-[color,background-color,box-shadow] duration-200 @3xl:flex-none",
            isActive
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
          {option.count !== undefined ? (
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] leading-[18px] tabular-nums transition-colors duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/[0.07] text-muted-foreground"
              )}
            >
              {formatNumber(option.count)}
            </span>
          ) : null}
        </button>
      )
    })}
  </div>
)

export default SegmentedControl
