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

import { buildLeadsHref, type LeadsSearchParams } from "@/lib/leads"

type NavigateOptions = {
  // Replace the history entry instead of adding one (used while typing)
  replace?: boolean
}

type LeadsNavigation = {
  // Updated the moment the user acts, so tabs and page buttons respond right
  // away. `committedParams` is what the rows on screen were loaded for.
  params: LeadsSearchParams
  committedParams: LeadsSearchParams
  isPending: boolean
  navigate: (
    changes: Partial<LeadsSearchParams>,
    options?: NavigateOptions
  ) => void
  resultsRef: React.RefObject<HTMLElement | null>
}

const LeadsNavigationContext = createContext<LeadsNavigation | null>(null)

// Search, the status tabs and pagination all change the URL through here, in a
// transition: the current rows stay on screen (dimmed) until the next ones are
// ready, instead of the whole page going back to its loading state.
export const LeadsNavigationProvider = ({
  params,
  children
}: {
  params: LeadsSearchParams
  children: React.ReactNode
}) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticParams, setOptimisticParams] = useOptimistic(params)
  const resultsRef = useRef<HTMLElement>(null)

  const navigate = useCallback(
    (changes: Partial<LeadsSearchParams>, { replace }: NavigateOptions = {}) => {
      const next = { ...optimisticParams, ...changes }
      const href = buildLeadsHref(next)

      startTransition(() => {
        setOptimisticParams(next)

        if (replace) {
          router.replace(href, { scroll: false })
        } else {
          router.push(href, { scroll: false })
        }
      })
    },
    [optimisticParams, router, setOptimisticParams]
  )

  return (
    <LeadsNavigationContext
      value={{
        params: optimisticParams,
        committedParams: params,
        isPending,
        navigate,
        resultsRef
      }}
    >
      {children}
    </LeadsNavigationContext>
  )
}

export const useLeadsNavigation = () => {
  const context = useContext(LeadsNavigationContext)

  if (!context) {
    throw new Error(
      "useLeadsNavigation must be used within LeadsNavigationProvider"
    )
  }

  return context
}
