"use client"

import { useRouter } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useOptimistic,
  useRef,
  useTransition
} from "react"

import { buildListHref, type ListParams } from "@/lib/list-params"

type NavigateOptions = {
  // Replace the history entry instead of adding one (used while typing)
  replace?: boolean
  // Bring the top of the list back into view (used by pagination)
  scrollToResults?: boolean
}

type UrlState<T extends ListParams> = {
  // Updated the moment the user acts, so filters and page buttons respond
  // right away. `committedParams` is what the rows on screen were loaded for.
  params: T
  committedParams: T
  isPending: boolean
  navigate: (changes: Partial<T>, options?: NavigateOptions) => void
  hrefFor: (changes: Partial<T>) => string
  // Back to the defaults, keeping the page size
  clearFilters: () => void
  resultsRef: React.RefObject<HTMLElement | null>
}

const UrlStateContext = createContext<UrlState<ListParams> | null>(null)

// Holds a list page's search, filters and pagination, which live in the URL.
// Every change runs in a transition: the current rows stay on screen (dimmed)
// until the next ones are ready, instead of the page going back to its
// loading state.
export const UrlStateProvider = ({
  pathname,
  params,
  defaults,
  children
}: {
  pathname: string
  params: ListParams
  defaults: ListParams
  children: React.ReactNode
}) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticParams, setOptimisticParams] = useOptimistic(params)
  const resultsRef = useRef<HTMLElement>(null)

  const hrefFor = useCallback(
    (changes: Partial<ListParams>) =>
      buildListHref(
        pathname,
        { ...optimisticParams, ...changes } as ListParams,
        defaults
      ),
    [defaults, optimisticParams, pathname]
  )

  const navigate = useCallback(
    (
      changes: Partial<ListParams>,
      { replace, scrollToResults }: NavigateOptions = {}
    ) => {
      const next = { ...optimisticParams, ...changes } as ListParams
      const href = buildListHref(pathname, next, defaults)

      const results = resultsRef.current
      if (scrollToResults && results && results.getBoundingClientRect().top < 0) {
        results.scrollIntoView({ behavior: "smooth", block: "start" })
      }

      startTransition(() => {
        setOptimisticParams(next)

        if (replace) {
          router.replace(href, { scroll: false })
        } else {
          router.push(href, { scroll: false })
        }
      })
    },
    [defaults, optimisticParams, pathname, router, setOptimisticParams]
  )

  const clearFilters = useCallback(
    () => navigate({ ...defaults, pageSize: optimisticParams.pageSize }),
    [defaults, navigate, optimisticParams.pageSize]
  )

  return (
    <UrlStateContext
      value={{
        params: optimisticParams,
        committedParams: params,
        isPending,
        navigate,
        hrefFor,
        clearFilters,
        resultsRef
      }}
    >
      {children}
    </UrlStateContext>
  )
}

export const useUrlState = <T extends ListParams = ListParams>() => {
  const context = useContext(UrlStateContext)

  if (!context) {
    throw new Error("useUrlState must be used within UrlStateProvider")
  }

  return context as unknown as UrlState<T>
}
