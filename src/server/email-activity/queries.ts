import { formatTimeAgo, formatUtcDateTime } from "@/lib/dates"
import {
  EMAIL_ACTIVITY_RANGES,
  type EmailActivityRange,
  type EmailActivitySearchParams,
  type TeamEmailSearchParams
} from "@/lib/email-activity"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { containsAny } from "@/server/lib/postgrest"

// Only the fields the page shows are read from the event payload; it also
// holds the full HTML of the email, which can be large.
const EVENT_COLUMNS = [
  "id",
  "created_at",
  "actor_id",
  "subject:payload->>subject",
  "recipient:payload->>to",
  "cc:payload->cc",
  "bcc:payload->bcc",
  "text_body:payload->>textBody",
  "lead:lead_id(id,name,email)",
  "mailbox:workspace_email_id(email,display_name)"
].join(",")

type EventRow = {
  id: string
  created_at: string
  actor_id: string | null
  subject: string | null
  recipient: string | null
  cc: string[] | null
  bcc: string[] | null
  text_body: string | null
  lead: { id: string; name: string; email: string | null } | null
  mailbox: { email: string; display_name: string | null } | null
}

type ProfileRow = {
  id: string
  full_name: string | null
  email: string
  role: string
}

export type Person = { name: string; email: string | null }

export type EmailActivityItem = {
  id: string
  sentAt: string
  sentAtLabel: string
  sentAtExact: string
  subject: string
  preview: string
  body: string
  cc: string[]
  bcc: string[]
  // Missing if the lead was deleted
  leadId: string | null
  lead: Person
  sender: Person | null
  mailbox: Person | null
}

export type SenderOption = { id: string; name: string }

const PREVIEW_LENGTH = 160

// Supabase returns plain error objects; real errors keep the message and a
// stack trace in the server logs
const toError = (error: { message: string }) =>
  new Error(
    `Failed to load email activity: ${error.message || "request failed"}`,
    { cause: error }
  )

// The start of a date range, e.g. 7 days ago; null for all time
const getRangeStart = (range: EmailActivityRange) => {
  const days = EMAIL_ACTIVITY_RANGES.find((option) => option.value === range)
    ?.days
  return days ? new Date(Date.now() - days * 86_400_000) : null
}

const toItem = (event: EventRow, sender: Person | null): EmailActivityItem => {
  const body = event.text_body?.trim() ?? ""

  return {
    id: event.id,
    sentAt: event.created_at,
    sentAtLabel: formatTimeAgo(event.created_at),
    sentAtExact: formatUtcDateTime(event.created_at),
    subject: event.subject?.trim() || "(No subject)",
    preview: body.replace(/\s+/g, " ").slice(0, PREVIEW_LENGTH),
    body,
    cc: event.cc ?? [],
    bcc: event.bcc ?? [],
    leadId: event.lead?.id ?? null,
    lead: {
      name: event.lead?.name ?? "Unknown lead",
      email: event.recipient ?? event.lead?.email ?? null
    },
    sender,
    mailbox: event.mailbox
      ? {
          name: event.mailbox.display_name || event.mailbox.email,
          email: event.mailbox.email
        }
      : null
  }
}

export const getEmailActivityPage = async ({
  query,
  member,
  range,
  page,
  pageSize
}: EmailActivitySearchParams) => {
  const supabase = getSupabaseAdminClient()
  const offset = (page - 1) * pageSize
  const since = getRangeStart(range)

  const sentEmails = (columns: string, head: boolean) => {
    let builder = supabase
      .from("lead_events")
      .select(columns, { count: head ? "exact" : undefined, head })
      .eq("event_type", "email_sent")

    if (member !== "all") builder = builder.eq("actor_id", member)
    if (since) builder = builder.gte("created_at", since.toISOString())
    if (query) {
      builder = builder.or(
        containsAny(["payload->>subject", "payload->>to"], query)
      )
    }

    return builder
  }

  // The count, the page of emails and the people who send them, all at once
  const [countResult, eventsResult, profilesResult] = await Promise.all([
    sentEmails("id", true),
    sentEmails(EVENT_COLUMNS, false)
      .order("created_at", { ascending: false })
      // Tie-breaker, so rows with the same timestamp never move between pages
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1),
    supabase.from("profiles").select("id, full_name, email, role")
  ])

  if (countResult.error) throw toError(countResult.error)
  if (eventsResult.error) throw toError(eventsResult.error)
  if (profilesResult.error) throw toError(profilesResult.error)

  const total = countResult.count ?? 0
  const events = (eventsResult.data ?? []) as unknown as EventRow[]
  const profiles = (profilesResult.data ?? []) as ProfileRow[]
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))

  const items = events.map((event) => {
    const sender = event.actor_id ? profileById.get(event.actor_id) : undefined

    return toItem(
      event,
      sender
        ? { name: sender.full_name || sender.email, email: sender.email }
        : null
    )
  })

  // Team members can be picked in the sender filter, plus whoever is picked
  // already (e.g. an admin, or someone no longer in the team)
  const senders: SenderOption[] = profiles
    .filter((profile) => profile.role === "team" || profile.id === member)
    .map((profile) => ({
      id: profile.id,
      name: profile.full_name || profile.email
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (member !== "all" && !senders.some((sender) => sender.id === member)) {
    senders.push({ id: member, name: "Unknown sender" })
  }

  return {
    items,
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    senders
  }
}

// The emails one team member sent, which they can search by the lead's name
// or email address (the one the email went to).
//
// Subjects aren't searched: they're stored with the rest of the email, HTML
// included, so finding one means reading every email the member sent, which
// takes seconds. Searching by lead stays well under one.
export const getTeamEmailsPage = async (
  { query, range, page, pageSize }: TeamEmailSearchParams,
  userId: string
) => {
  const supabase = getSupabaseAdminClient()
  const offset = (page - 1) * pageSize
  const since = getRangeStart(range)

  const sentEmails = (columns: string, head: boolean) => {
    let builder = supabase
      .from("lead_events")
      // `lead_match` is the lead once more, only there to be searched; with
      // !inner, only the emails whose lead matches are kept
      .select(query ? `${columns},lead_match:lead_id!inner(id)` : columns, {
        count: head ? "exact" : undefined,
        head
      })
      .eq("event_type", "email_sent")
      .eq("actor_id", userId)

    if (since) builder = builder.gte("created_at", since.toISOString())
    if (query) {
      builder = builder.or(containsAny(["name", "email"], query), {
        referencedTable: "lead_match"
      })
    }

    return builder
  }

  const [countResult, eventsResult] = await Promise.all([
    sentEmails("id", true),
    sentEmails(EVENT_COLUMNS, false)
      .order("created_at", { ascending: false })
      // Tie-breaker, so rows with the same timestamp never move between pages
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1)
  ])

  if (countResult.error) throw toError(countResult.error)
  if (eventsResult.error) throw toError(eventsResult.error)

  const total = countResult.count ?? 0
  const events = (eventsResult.data ?? []) as unknown as EventRow[]

  return {
    // They're all the team member's own, so no sender is needed
    items: events.map((event) => toItem(event, null)),
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize))
  }
}
