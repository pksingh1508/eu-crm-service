import PageHeader from "@/components/layout/page-header"

// Shared by the page and its loading state so the header doesn't move or flash
const TeamDashboardHeader = () => (
  <PageHeader
    title="Dashboard"
    description="Your email activity and the new leads waiting for you."
  />
)

export default TeamDashboardHeader
