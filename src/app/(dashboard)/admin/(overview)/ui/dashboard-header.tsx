import PageHeader from "@/components/layout/page-header"

// Shared by the page and its loading state so the header doesn't move or flash
const DashboardHeader = () => (
  <PageHeader
    title="Admin Dashboard"
    description="Monitor lead intake and outbound email performance across your team."
  />
)

export default DashboardHeader
