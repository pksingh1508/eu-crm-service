"use client"

import { Button } from "@/components/ui/button"

import { useLeadsNavigation } from "./leads-navigation"

const ClearFiltersButton = () => {
  const { navigate } = useLeadsNavigation()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate({ query: "", status: "all", page: 1 })}
    >
      Clear filters
    </Button>
  )
}

export default ClearFiltersButton
