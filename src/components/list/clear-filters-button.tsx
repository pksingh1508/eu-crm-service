"use client"

import { Button } from "@/components/ui/button"

import { useUrlState } from "./url-state"

const ClearFiltersButton = () => {
  const { clearFilters } = useUrlState()

  return (
    <Button variant="outline" size="sm" onClick={clearFilters}>
      Clear filters
    </Button>
  )
}

export default ClearFiltersButton
