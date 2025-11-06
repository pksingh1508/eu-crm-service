import EmailTemplateManager from "./ui/email-template-manager";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const EmailTemplateAdminPage = async () => {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("email_templates")
    .select("id, template_name, subject, body_html, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[admin-email-template] failed to load templates", error);
  }

  const templates =
    data?.map((template) => ({
      id: template.id,
      templateName: template.template_name,
      subject: template.subject,
      bodyHtml: template.body_html ?? "",
      createdAt: template.created_at,
      updatedAt: template.updated_at
    })) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Email Templates
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Create and manage reusable outbound email templates for your team.
        </p>
      </div>

      <EmailTemplateManager initialTemplates={templates} />
    </div>
  );
};

export default EmailTemplateAdminPage;
