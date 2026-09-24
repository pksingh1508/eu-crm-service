import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-foreground/[0.07]",
        // A soft highlight that sweeps across (off-screen when motion is reduced)
        "after:absolute after:inset-0 after:-translate-x-full after:bg-linear-to-r after:from-transparent after:via-background/70 after:to-transparent motion-safe:after:animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
