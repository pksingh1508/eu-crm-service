// Shared by the server (data fetching) and the browser (filters, pagination),
// so this file must not import anything server-only.

import {
  buildListHref,
  DEFAULT_PAGE_SIZE,
  parseOption,
  parsePage,
  parsePageSize,
  parseQuery,
  type RawSearchParams
} from "./list-params"

export const LEAD_STATUS_FILTERS = ["all", "new", "email-send"] as const
export type LeadStatusFilter = (typeof LEAD_STATUS_FILTERS)[number]

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

export const LEADS_PATH = "/admin/leads"

export const LEADS_DEFAULTS: LeadsSearchParams = {
  query: "",
  status: "all",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE
}

export const parseLeadsSearchParams = (
  raw: RawSearchParams
): LeadsSearchParams => ({
  query: parseQuery(raw.query),
  status: parseOption(raw.status, LEAD_STATUS_FILTERS, "all"),
  page: parsePage(raw.page),
  pageSize: parsePageSize(raw.pageSize)
})

export const buildLeadsHref = (params: LeadsSearchParams) =>
  buildListHref(LEADS_PATH, params, LEADS_DEFAULTS)

// A team member's list ("My leads") uses the same search params
export const TEAM_LEADS_PATH = "/team/leads"

export const buildTeamLeadsHref = (params: LeadsSearchParams) =>
  buildListHref(TEAM_LEADS_PATH, params, LEADS_DEFAULTS)
