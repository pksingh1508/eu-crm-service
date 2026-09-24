import { panelRowClassName } from "@/components/dashboard/dashboard-panel"
import { Skeleton } from "@/components/ui/skeleton"

// A placeholder row in the shape of the lead and email lists
const ListRowSkeleton = () => (
  <li className={panelRowClassName}>
    <Skeleton className="size-8 shrink-0 rounded-full" />
    <div className="min-w-0 flex-1">
      <div className="flex h-5 items-center">
        <Skeleton className="h-3.5 w-32 max-w-full" />
      </div>
      <div className="flex h-4 items-center">
        <Skeleton className="h-3 w-48 max-w-full" />
      </div>
    </div>
    <Skeleton className="h-3 w-16 shrink-0" />
  </li>
)

export default ListRowSkeleton
