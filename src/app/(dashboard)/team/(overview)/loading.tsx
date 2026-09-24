import { StatCardSkeleton } from "@/components/ui/stat-card";

import { LeadsQueueSkeleton } from "./ui/leads-queue";
import { RecentEmailsSkeleton } from "./ui/recent-emails";
import TeamDashboardHeader from "./ui/team-dashboard-header";

// Shown right away while the dashboard data loads. It lives in the (overview)
// route group so it only applies to /team, not the other team pages. The
// layout mirrors page.tsx.
const TeamDashboardLoading = () => (
  <div className="@container space-y-6 md:space-y-8">
    <TeamDashboardHeader />
    <p role="status" className="sr-only">
      Loading dashboard…
    </p>

    <div className="grid gap-4 md:gap-6 @xl:grid-cols-2 @4xl:grid-cols-3">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton className="@xl:col-span-2 @4xl:col-span-1" />
    </div>

    <div className="grid gap-4 md:gap-6 @4xl:grid-cols-5">
      <LeadsQueueSkeleton className="@4xl:col-span-2" />
      <RecentEmailsSkeleton className="@4xl:col-span-3" />
    </div>
  </div>
);

export default TeamDashboardLoading;
