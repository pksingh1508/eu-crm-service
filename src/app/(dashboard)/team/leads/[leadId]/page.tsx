import { redirect } from "next/navigation";

import EmailComposer from "./ui/email-composer";
import LeadTimeline from "./ui/lead-timeline";
import SendEmailButton from "./ui/send-email-button";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type LeadDetails = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  source: Record<string, any> | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

type LeadEventRow = {
  id: string;
  event_type: string;
  payload: Record<string, any> | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
};

const LeadDetailPage = async ({
  params
}: {
  params: Promise<{ leadId: string }>;
}) => {
  const resolvedParams = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[team-lead-detail] failed to verify auth user", userError);
  }

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: leadData, error: leadError } = await supabaseAdmin
    .from("leads")
    .select(
      "id, name, email, company, phone, notes, status, source, assigned_to, created_at, updated_at"
    )
    .eq("id", resolvedParams.leadId)
    .maybeSingle();

  if (leadError) {
    console.error("[team-lead-detail] load error", leadError);
    redirect("/team/leads");
  }

  if (!leadData) {
    redirect("/team/leads");
  }

  const lead = leadData as LeadDetails;

  const [
    { data: eventsData },
    { data: profileData },
    { data: templatesData }
  ] = await Promise.all([
    supabaseAdmin
      .from("lead_events")
      .select("id, event_type, payload, created_at")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("profiles")
      .select("workspace_email_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("email_templates")
      .select("id, template_name, subject, body_html, body_text")
      .order("updated_at", { ascending: false })
  ]);
  const events = (eventsData ?? []) as unknown as LeadEventRow[];
  const workspaceEmailId = profileData?.workspace_email_id ?? null;
  const templates =
    templatesData?.map((template) => ({
      id: template.id,
      name: template.template_name,
      subject: template.subject,
      bodyHtml: template.body_html,
      bodyText: template.body_text
    })) ?? [];

  const leadInfoItems = [
    { label: "Email", value: lead.email ?? "—" },
    // { label: "Company", value: lead.company ?? "—" },
    { label: "Phone", value: lead.phone ?? "—" },
    { label: "Status", value: lead.status },
    {
      label: "Last updated",
      value: new Date(lead.updated_at).toLocaleString()
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Lead</p>
          <h1 className="text-3xl font-semibold text-slate-900">{lead.name}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {lead.notes ?? "No notes yet. Add context as you progress."}
          </p>
        </div>
        {lead.status !== "email-send" && (
          <div className="flex flex-col items-start gap-2 md:items-end">
            <SendEmailButton leadId={lead.id} disabled={!workspaceEmailId} />
            {!workspaceEmailId ? (
              <p className="text-xs text-rose-600">
                No workspace mailbox assigned. Please contact an administrator.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <LeadTimeline events={events} />

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Lead information
            </h2>
            <dl className="mt-4 space-y-3">
              {leadInfoItems.map((item) => (
                <div key={item.label} className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    {item.label}
                  </dt>
                  <dd className="text-sm text-slate-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {lead.source ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Source metadata
              </h2>
              <pre className="mt-3 overflow-x-auto rounded-md bg-slate-950/90 p-4 text-xs text-slate-100">
                {JSON.stringify(lead.source, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      </div>

      <EmailComposer
        lead={{ id: lead.id, name: lead.name, email: lead.email }}
        workspaceEmailId={workspaceEmailId}
        templates={templates}
      />
    </div>
  );
};

export default LeadDetailPage;
