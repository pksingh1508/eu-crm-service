type LeadEventRow = {
  id: string
  event_type: string
  payload: Record<string, any> | null
  created_at: string
  profiles: {
    full_name: string | null
    email: string | null
  } | null
}

const EVENT_LABELS: Record<string, string> = {
  created: "Lead created",
  updated: "Lead updated",
  assigned: "Lead assigned",
  status_changed: "Status changed",
  note_added: "Note added",
  contacted: "Contacted",
  email_sent: "Email sent",
  email_received: "Email received"
}

const LeadTimeline = ({ events }: { events: LeadEventRow[] }) => {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          No activity logged for this lead yet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
      <ol className="mt-4 space-y-6">
        {events.map((event) => {
          const label =
            EVENT_LABELS[event.event_type] ?? event.event_type.replace("_", " ")
          const actor =
            event.profiles?.full_name ??
            event.profiles?.email ??
            "System"
          const timestamp = new Date(event.created_at).toLocaleString()
          const description =
            event.event_type === "email_sent"
              ? event.payload?.subject ?? "Email sent"
              : event.payload?.message ??
                event.payload?.status ??
                ""

          return (
            <li key={event.id} className="relative pl-6">
              <span className="absolute left-0 top-1 h-2 w-2 rounded-full bg-slate-400" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-slate-900">
                  {label}
                </p>
                <p className="text-xs text-slate-500">
                  {timestamp} - {actor}
                </p>
                {description ? (
                  <p className="text-sm text-slate-600">{description}</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default LeadTimeline
