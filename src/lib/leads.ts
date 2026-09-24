// Shared by the server (data fetching) and the browser (filters, pagination),
// so this file must not import anything server-only.

export const LEAD_STATUS_FILTERS = ["all", "new", "email-send"] as const
export type LeadStatusFilter = (typeof LEAD_STATUS_FILTERS)[number]

export const LEADS_PAGE_SIZES = [25, 50, 100] as const
export const DEFAULT_LEADS_PAGE_SIZE = 50

const MAX_QUERY_LENGTH = 100

const statusLabels: Record<string, string> = {
  new: "New",
  "email-send": "Email sent"
}

export const getLeadStatusLabel = (status: string | null) =>
  !status
    ? "Unknown"
    : statusLabels[status] ??
      status.charAt(0).toUpperCase() + status.slice(1).replace(/[-_]/g, " ")

export type LeadsSearchParams = {
  query: string
  status: LeadStatusFilter
  page: number
  pageSize: number
}

type RawSearchParams = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

// Anything missing or invalid in the URL falls back to a default
export const parseLeadsSearchParams = (
  raw: RawSearchParams
): LeadsSearchParams => {
  const status = first(raw.status) as LeadStatusFilter
  const page = Number(first(raw.page))
  const pageSize = Number(first(raw.pageSize))

  return {
    query: (first(raw.query) ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    status: LEAD_STATUS_FILTERS.includes(status) ? status : "all",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: LEADS_PAGE_SIZES.some((size) => size === pageSize)
      ? pageSize
      : DEFAULT_LEADS_PAGE_SIZE
  }
}

// Default values are left out so the URLs stay short
export const buildLeadsHref = ({
  query,
  status,
  page,
  pageSize
}: LeadsSearchParams) => {
  const params = new URLSearchParams()

  if (query) params.set("query", query)
  if (status !== "all") params.set("status", status)
  if (page > 1) params.set("page", String(page))
  if (pageSize !== DEFAULT_LEADS_PAGE_SIZE) {
    params.set("pageSize", String(pageSize))
  }

  const search = params.toString()
  return search ? `/admin/leads?${search}` : "/admin/leads"
}
