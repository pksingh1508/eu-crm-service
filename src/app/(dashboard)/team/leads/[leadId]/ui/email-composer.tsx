"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import generateEmailHTML, {
  generateEmailPlainText,
  WELCOME_TEMPLATE_SUBJECT
} from "@/emails_templates/welcome_template";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

type LeadInfo = {
  id: string;
  name: string;
  email: string | null;
};

type EmailComposerProps = {
  lead: LeadInfo;
  workspaceEmailId: string | null;
};

const TEMPLATE_OPTIONS = [
  {
    id: "welcome-template",
    name: "EU Career Serwis | Welcome",
    subject: WELCOME_TEMPLATE_SUBJECT
  }
] as const;

const EmailComposer = ({ lead, workspaceEmailId }: EmailComposerProps) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { isEmailComposerOpen, activeLeadId, closeEmailComposer } =
    useUiStore();

  const fallbackCandidateName = useMemo(
    () => lead.name?.trim() || lead.email?.trim() || "Candidate",
    [lead.name, lead.email]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [candidateName, setCandidateName] = useState(fallbackCandidateName);
  const [subject, setSubject] = useState("");
  const [textBody, setTextBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOpen = isEmailComposerOpen && activeLeadId === lead.id;

  const senderName = useMemo(() => {
    if (user?.email) {
      const [localPart] = user.email.split("@");
      return localPart.replace(".", " ");
    }
    return "Team member";
  }, [user?.email]);

  const fallbackContactPerson = senderName;
  const [contactPerson, setContactPerson] = useState(fallbackContactPerson);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplateId(null);
      setSubject("");
      setTextBody("");
      setFeedback(null);
      setError(null);
      setCandidateName(fallbackCandidateName);
      setContactPerson(fallbackContactPerson);
    }
  }, [isOpen, fallbackCandidateName, fallbackContactPerson]);

  const resolveCandidateName = () =>
    candidateName.trim() || fallbackCandidateName || "Candidate";
  const resolveContactPerson = () =>
    contactPerson.trim() || fallbackContactPerson || "Team member";

  const applyTemplate = (templateId: string) => {
    const template = TEMPLATE_OPTIONS.find((tpl) => tpl.id === templateId);
    if (!template) {
      return;
    }

    try {
      const templateCandidateName = resolveCandidateName();
      const templateContactPerson = resolveContactPerson();
      const templateProps = {
        candidateName: templateCandidateName,
        contactPerson: templateContactPerson
      };

      const plainText = generateEmailPlainText(templateProps);

      setSubject(template.subject);
      setTextBody(plainText);
      setFeedback(null);
      setError(null);
    } catch (templateError) {
      console.error(
        "[email-composer] template generation error",
        templateError
      );
      setError("Unable to generate the email template. Please try again.");
    }
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplateId(value);
    applyTemplate(value);
  };

  const handleSend = async () => {
    if (!workspaceEmailId) {
      setError(
        "No workspace mailbox is assigned to you. Contact an administrator."
      );
      return;
    }

    const trimmedSubject = subject.trim();
    const trimmedTextBody = textBody.trim();

    if (!trimmedSubject || !trimmedTextBody) {
      setError("Please provide a subject and plain text body.");
      return;
    }

    const candidateForTemplate = resolveCandidateName();
    const contactPersonForTemplate = resolveContactPerson();
    const templateProps = {
      candidateName: candidateForTemplate,
      contactPerson: contactPersonForTemplate
    };

    const htmlBody =
      selectedTemplateId !== null ? generateEmailHTML(templateProps) : null;

    setIsSending(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          leadId: lead.id,
          subject: trimmedSubject,
          textBody: trimmedTextBody,
          htmlBody,
          workspaceEmailId,
          replyTo: user?.email
        })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message ?? "Failed to send email.");
      }

      setFeedback("Email sent successfully.");
      toast.success("Email sent successfully.");
      router.refresh();
      setTimeout(() => {
        closeEmailComposer();
      }, 800);
    } catch (err) {
      console.error("[email-composer] send failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unexpected error while sending email."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeEmailComposer}>
      <DialogContent className="max-w-2xl sm:max-w-3xl w-[95vw] overflow-hidden p-0">
        <div className="flex max-h-[calc(100vh-4rem)] flex-col">
          <div className="space-y-2 border-b border-slate-200 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle>Send email to {lead.name ?? lead.email}</DialogTitle>
              <DialogDescription>
                Use a template or write from scratch. Emails send via your
                assigned workspace mailbox.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-4 pb-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Template
                </label>
                <Select
                  value={selectedTemplateId ?? ""}
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_OPTIONS.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="candidateName"
                  className="text-sm font-medium text-slate-700"
                >
                  Candidate name
                </label>
                <Input
                  id="candidateName"
                  value={candidateName}
                  onChange={(event) => setCandidateName(event.target.value)}
                  placeholder={fallbackCandidateName}
                />
                <p className="text-xs text-slate-500">
                  Update the candidate name before applying the template.
                </p>
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="contactPerson"
                  className="text-sm font-medium text-slate-700"
                >
                  Contact person
                </label>
                <Input
                  id="contactPerson"
                  value={contactPerson}
                  onChange={(event) => setContactPerson(event.target.value)}
                  placeholder={fallbackContactPerson}
                />
                <p className="text-xs text-slate-500">
                  This name appears in the signature and body of the template.
                </p>
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="subject"
                  className="text-sm font-medium text-slate-700"
                >
                  Subject
                </label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="textBody"
                  className="text-sm font-medium text-slate-700"
                >
                  Plain text body
                </label>
                <Textarea
                  id="textBody"
                  value={textBody}
                  onChange={(event) => setTextBody(event.target.value)}
                  rows={6}
                  placeholder="Compose your message..."
                />
              </div>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              {feedback ? (
                <p className="text-sm text-emerald-600">{feedback}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 px-6 py-4">
            <Button
              variant="outline"
              type="button"
              onClick={closeEmailComposer}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending || !workspaceEmailId}
            >
              {isSending ? (
                <>
                  <Spinner className="mr-2 text-white" />
                  sending...
                </>
              ) : (
                "Send email"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailComposer;
