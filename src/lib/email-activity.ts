// Shared by the server (data fetching) and the browser (filters, pagination),
// so this file must not import anything server-only.

import {
  buildListHref,
  DEFAULT_PAGE_SIZE,
  firstValue,
  parseOption,
  parsePage,
  parsePageSize,
  parseQuery,
  type RawSearchParams
} from "./list-params"

export const EMAIL_ACTIVITY_RANGES = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "all", label: "All time", days: null }
] as const

export type EmailActivityRange = (typeof EMAIL_ACTIVITY_RANGES)[number]["value"]

export type EmailActivitySearchParams = {
  query: string
  // A sender's user id, or "all"
  member: string
  range: EmailActivityRange
  page: number
  pageSize: number
}

export const EMAIL_ACTIVITY_PATH = "/admin/email-activity"

export const EMAIL_ACTIVITY_DEFAULTS: EmailActivitySearchParams = {
  query: "",
  member: "all",
  range: "all",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const parseEmailActivitySearchParams = (
  raw: RawSearchParams
): EmailActivitySearchParams => {
  const member = firstValue(raw.member) ?? ""

  return {
    query: parseQuery(raw.query),
    member: UUID_PATTERN.test(member) ? member.toLowerCase() : "all",
    range: parseOption(
      raw.range,
      EMAIL_ACTIVITY_RANGES.map((range) => range.value),
      "all"
    ),
    page: parsePage(raw.page),
    pageSize: parsePageSize(raw.pageSize)
  }
}

export const buildEmailActivityHref = (params: EmailActivitySearchParams) =>
  buildListHref(EMAIL_ACTIVITY_PATH, params, EMAIL_ACTIVITY_DEFAULTS)
