// URL search params for list pages (search, filters, pagination). Used by the
// server and the browser, so this file must not import anything server-only.

export type ListParams = Record<string, string | number>
export type RawSearchParams = Record<string, string | string[] | undefined>

export const PAGE_SIZES = [25, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 50
export const MAX_QUERY_LENGTH = 100

export const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

// Anything missing or invalid in the URL falls back to a default

export const parseQuery = (value: string | string[] | undefined) =>
  (firstValue(value) ?? "").trim().slice(0, MAX_QUERY_LENGTH)

export const parsePage = (value: string | string[] | undefined) => {
  const page = Number(firstValue(value))
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

export const parsePageSize = (value: string | string[] | undefined) => {
  const size = Number(firstValue(value))
  return PAGE_SIZES.some((pageSize) => pageSize === size)
    ? size
    : DEFAULT_PAGE_SIZE
}

export const parseOption = <T extends string>(
  value: string | string[] | undefined,
  options: readonly T[],
  fallback: T
): T => {
  const option = firstValue(value) as T
  return options.includes(option) ? option : fallback
}

// Values equal to their default are left out, so the URLs stay short
export const buildListHref = (
  pathname: string,
  params: ListParams,
  defaults: ListParams
) => {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== defaults[key] && value !== "") {
      search.set(key, String(value))
    }
  }

  const query = search.toString()
  return query ? `${pathname}?${query}` : pathname
}
