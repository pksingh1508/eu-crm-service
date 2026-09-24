"use client"

import { useUrlState } from "@/components/list/url-state"
import SegmentedControl from "@/components/ui/segmented-control"
import {
  EMAIL_ACTIVITY_RANGES,
  type EmailActivitySearchParams
} from "@/lib/email-activity"

const RangeFilter = () => {
  const { params, navigate } = useUrlState<EmailActivitySearchParams>()

  return (
    <SegmentedControl
      label="Filter by date"
      value={params.range}
      onValueChange={(range) => navigate({ range, page: 1 })}
      options={EMAIL_ACTIVITY_RANGES}
      className="@xl:w-auto"
    />
  )
}

export default RangeFilter
