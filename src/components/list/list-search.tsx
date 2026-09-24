"use client"

import { LoaderCircle, Search, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import { MAX_QUERY_LENGTH } from "@/lib/list-params"
import { cn } from "@/lib/utils"

import { useUrlState } from "./url-state"

// Wait for a short pause in typing before searching
const SEARCH_DELAY_MS = 350

// Search box for a list page; the text goes to the `query` URL param
const ListSearch = ({
  placeholder,
  label,
  className
}: {
  placeholder: string
  label: string
  className?: string
}) => {
  const { params, committedParams, isPending, navigate } = useUrlState<{
    query: string
    page: number
  }>()
  const [value, setValue] = useState(params.query)
  // The last query this box put in the URL. A different one means the URL
  // changed some other way (back button, "Clear filters"), so the box follows.
  const submittedQuery = useRef(params.query)

  useEffect(() => {
    if (params.query !== submittedQuery.current) {
      submittedQuery.current = params.query
      setValue(params.query)
    }
  }, [params.query])

  const submit = useCallback(
    (query: string) => {
      const previousQuery = submittedQuery.current
      if (query === previousQuery) return

      submittedQuery.current = query
      // Refining a search replaces the history entry; starting or clearing one
      // adds an entry, so Back returns to the full list
      navigate(
        { query, page: 1 },
        { replace: previousQuery !== "" && query !== "" }
      )
    },
    [navigate]
  )

  useEffect(() => {
    const timeout = setTimeout(() => submit(value.trim()), SEARCH_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [value, submit])

  const clear = () => {
    setValue("")
    submit("")
  }

  const isSearching = isPending && committedParams.query !== params.query
  const Icon = isSearching ? LoaderCircle : Search

  return (
    <div className={cn("relative w-full", className)}>
      <Icon
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
          isSearching && "animate-spin"
        )}
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit(value.trim())
          if (event.key === "Escape" && value) clear()
        }}
        placeholder={placeholder}
        aria-label={label}
        enterKeyHint="search"
        maxLength={MAX_QUERY_LENGTH}
        className="h-9 bg-background pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export default ListSearch
