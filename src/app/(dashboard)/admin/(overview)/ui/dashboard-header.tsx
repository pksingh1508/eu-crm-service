// Shared by the page and its loading state so the header doesn't move or flash
const DashboardHeader = () => (
  <div className="space-y-1.5">
    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
      Admin Dashboard
    </h1>
    <p className="text-sm text-muted-foreground">
      Monitor lead intake and outbound email performance across your team.
    </p>
  </div>
)

export default DashboardHeader
