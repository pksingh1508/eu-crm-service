"use client"

import { useUrlState } from "@/components/list/url-state"
import SegmentedControl from "@/components/ui/segmented-control"
import {
  getLeadStatusLabel,
  type LeadsSearchParams,
  type LeadStatusFilter
} from "@/lib/leads"

const StatusFilter = ({
  counts
}: {
  counts: Record<LeadStatusFilter, number>
}) => {
  const { params, navigate } = useUrlState<LeadsSearchParams>()

  return (
    <SegmentedControl
      label="Filter by status"
      value={params.status}
      onValueChange={(status) => navigate({ status, page: 1 })}
      options={[
        { value: "all", label: "All", count: counts.all },
        { value: "new", label: getLeadStatusLabel("new"), count: counts.new },
        {
          value: "email-send",
          label: getLeadStatusLabel("email-send"),
          count: counts["email-send"]
        }
      ]}
    />
  )
}

export default StatusFilter
