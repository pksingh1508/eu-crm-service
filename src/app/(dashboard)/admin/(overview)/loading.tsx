import { StatCardSkeleton } from "@/components/ui/stat-card";

import DashboardHeader from "./ui/dashboard-header";
import { RecentLeadsSkeleton } from "./ui/recent-leads";
import { TeamActivitySkeleton } from "./ui/team-activity";

// Shown right away while the dashboard data loads. It lives in the (overview)
// route group so it only applies to /admin, not the other admin pages. The
// layout mirrors page.tsx.
const AdminDashboardLoading = () => (
  <div className="@container space-y-6 md:space-y-8">
    <DashboardHeader />
    <p role="status" className="sr-only">
      Loading dashboard…
    </p>

    <div className="grid gap-4 md:gap-6 @xl:grid-cols-2 @4xl:grid-cols-3">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton className="@xl:col-span-2 @4xl:col-span-1" />
    </div>

    <div className="grid gap-4 md:gap-6 @4xl:grid-cols-5">
      <TeamActivitySkeleton className="@4xl:col-span-2" />
      <RecentLeadsSkeleton className="@4xl:col-span-3" />
    </div>
  </div>
);

export default AdminDashboardLoading;
