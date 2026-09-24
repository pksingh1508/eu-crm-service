import PageHeader from "@/components/layout/page-header"

// Shared by the page, its loading state and its error state
const EmailActivityHeader = () => (
  <PageHeader
    title="Email activity"
    description="Review outbound email history, filter by team member, and audit lead interactions."
  />
)

export default EmailActivityHeader
