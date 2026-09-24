import type { LeadsSearchParams } from "@/lib/leads"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { containsAny } from "@/server/lib/postgrest"

export type LeadListItem = {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: string | null
  send_by: string | null
  created_at: string
}

const LEAD_COLUMNS = "id, name, email, phone, status, send_by, created_at"

// "All" lists new leads first, then the ones that were emailed, then any other
// status. Each group is its own query, so no database change is needed for
// this order.
const STATUS_GROUPS = ["new", "email-send", "other"] as const
type StatusGroup = (typeof STATUS_GROUPS)[number]

// Supabase returns plain error objects; real errors keep the message and a
// stack trace in the server logs
const toError = (error: { message: string }) =>
  new Error(`Failed to load leads: ${error.message || "request failed"}`, {
    cause: error
  })

const selectGroup = (
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  group: StatusGroup,
  query: string,
  { head }: { head: boolean }
) => {
  const builder = supabase.from("leads").select(head ? "id" : LEAD_COLUMNS, {
    count: head ? "exact" : undefined,
    head
  })
  const inGroup =
    group === "other"
      ? builder.not("status", "in", "(new,email-send)")
      : builder.eq("status", group)

  return query
    ? inGroup.or(containsAny(["name", "email", "phone", "company"], query))
    : inGroup
}

export const getLeadsPage = async ({
  query,
  status,
  page,
  pageSize
}: LeadsSearchParams) => {
  const supabase = getSupabaseAdminClient()
  const groups: StatusGroup[] = status === "all" ? [...STATUS_GROUPS] : [status]
  const offset = (page - 1) * pageSize

  const countGroup = async (group: StatusGroup) => {
    const { count, error } = await selectGroup(supabase, group, query, {
      head: true
    })

    if (error) throw toError(error)
    return count ?? 0
  }

  const fetchGroup = async (group: StatusGroup, from: number, to: number) => {
    const { data, error } = await selectGroup(supabase, group, query, {
      head: false
    })
      .order("created_at", { ascending: false })
      // Tie-breaker, so rows with the same timestamp never move between pages
      .order("id", { ascending: false })
      .range(from, to)

    if (error) throw toError(error)
    return (data ?? []) as unknown as LeadListItem[]
  }

  // The counts (also used by the status tabs) and the first group's rows are
  // fetched together; a page inside the first group needs nothing more.
  const [newCount, emailSentCount, otherCount, firstGroupLeads] =
    await Promise.all([
      countGroup("new"),
      countGroup("email-send"),
      countGroup("other"),
      fetchGroup(groups[0], offset, offset + pageSize - 1)
    ])

  const groupCounts: Record<StatusGroup, number> = {
    new: newCount,
    "email-send": emailSentCount,
    other: otherCount
  }
  const total = groups.reduce((sum, group) => sum + groupCounts[group], 0)

  // Fill the rest of the page from the following groups, in order
  const remaining: { group: StatusGroup; from: number; to: number }[] = []
  let groupStart = groupCounts[groups[0]]

  for (const group of groups.slice(1)) {
    const from = Math.max(0, offset - groupStart)
    const to = Math.min(groupCounts[group], offset + pageSize - groupStart) - 1

    if (to >= from) remaining.push({ group, from, to })
    groupStart += groupCounts[group]
  }

  const remainingLeads = await Promise.all(
    remaining.map(({ group, from, to }) => fetchGroup(group, from, to))
  )

  return {
    leads: [...firstGroupLeads, ...remainingLeads.flat()],
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    statusCounts: {
      all: newCount + emailSentCount + otherCount,
      new: newCount,
      "email-send": emailSentCount
    }
  }
}

export type LeadsPage = Awaited<ReturnType<typeof getLeadsPage>>

export type TeamLeadListItem = {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: string | null
  updated_at: string
}

const TEAM_LEAD_COLUMNS = "id, name, email, phone, status, updated_at"

type TeamLeadGroup = "new" | "email-send"

// A team member's leads: every new lead (waiting for a first email), then the
// leads they emailed. Each group shows the latest change first, so a lead that
// fills in the form again is back at the top of the new leads.
export const getTeamLeadsPage = async (
  { query, status, page, pageSize }: LeadsSearchParams,
  // The team member's email address, which is saved as "Sent by"
  sentBy: string | null
) => {
  const supabase = getSupabaseAdminClient()
  const groups: TeamLeadGroup[] =
    status === "all" ? ["new", "email-send"] : [status]
  const offset = (page - 1) * pageSize

  const selectGroup = (group: TeamLeadGroup, { head }: { head: boolean }) => {
    let builder = supabase
      .from("leads")
      .select(head ? "id" : TEAM_LEAD_COLUMNS, {
        count: head ? "exact" : undefined,
        head
      })
      .eq("status", group)

    if (group === "email-send") {
      // Without an email address there are no emails of theirs to match
      builder = sentBy ? builder.eq("send_by", sentBy) : builder.is("id", null)
    }

    return query
      ? builder.or(containsAny(["name", "email", "phone", "company"], query))
      : builder
  }

  const countGroup = async (group: TeamLeadGroup) => {
    const { count, error } = await selectGroup(group, { head: true })

    if (error) throw toError(error)
    return count ?? 0
  }

  const fetchGroup = async (group: TeamLeadGroup, from: number, to: number) => {
    const { data, error } = await selectGroup(group, { head: false })
      .order("updated_at", { ascending: false })
      // Tie-breaker, so rows with the same timestamp never move between pages
      .order("id", { ascending: false })
      .range(from, to)

    if (error) throw toError(error)
    return (data ?? []) as unknown as TeamLeadListItem[]
  }

  // The counts (also used by the status tabs) and the first group's rows are
  // fetched together; a page inside the first group needs nothing more.
  const [newCount, emailSentCount, firstGroupLeads] = await Promise.all([
    countGroup("new"),
    countGroup("email-send"),
    fetchGroup(groups[0], offset, offset + pageSize - 1)
  ])

  const groupCounts: Record<TeamLeadGroup, number> = {
    new: newCount,
    "email-send": emailSentCount
  }
  const total = groups.reduce((sum, group) => sum + groupCounts[group], 0)

  // On "All", a page can run on from the new leads into the emailed ones
  const emailSentFrom = Math.max(0, offset - newCount)
  const emailSentTo = Math.min(emailSentCount, offset + pageSize - newCount) - 1
  const emailSentLeads =
    status === "all" && emailSentTo >= emailSentFrom
      ? await fetchGroup("email-send", emailSentFrom, emailSentTo)
      : []

  return {
    leads: [...firstGroupLeads, ...emailSentLeads],
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    statusCounts: {
      all: newCount + emailSentCount,
      new: newCount,
      "email-send": emailSentCount
    }
  }
}
