"use client";

import { useEffect, useState } from "react";
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
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";

type LeadInfo = {
  id: string;
  name: string;
  email: string | null;
};

type EmailComposerProps = {
  lead: LeadInfo;
  workspaceEmailId: string | null;
  templates: EmailTemplateSummary[];
};

type EmailTemplateSummary = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string | null;
  bodyText: string | null;
};

const htmlToPlainText = (html: string) =>
  html
    .replace(/<\/?(p|div|section|h[1-6])>/gi, "\n\n")
    .replace(/<li>\s*/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const plainTextToHtml = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");

const EmailComposer = ({
  lead,
  workspaceEmailId,
  templates
}: EmailComposerProps) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { isEmailComposerOpen, activeLeadId, closeEmailComposer } =
    useUiStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [subject, setSubject] = useState("");
  const [textBody, setTextBody] = useState("");
  const [htmlBody, setHtmlBody] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOpen = isEmailComposerOpen && activeLeadId === lead.id;

  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplateId(null);
      setSubject("");
      setTextBody("");
      setHtmlBody(null);
      setFeedback(null);
      setError(null);
    }
  }, [isOpen]);

  const applyTemplate = (templateId: string) => {
    const template = templates.find((tpl) => tpl.id === templateId);
    if (!template) {
      return;
    }

    try {
      setSubject(template.subject);
      const plainText = template.bodyText?.trim().length
        ? template.bodyText
        : template.bodyHtml
        ? htmlToPlainText(template.bodyHtml)
        : "";
      setTextBody(plainText);
      setHtmlBody(template.bodyHtml ?? null);
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

    const templateHtml =
      selectedTemplateId !== null
        ? htmlBody ?? plainTextToHtml(trimmedTextBody)
        : plainTextToHtml(trimmedTextBody);

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
          htmlBody: templateHtml,
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
                    {templates.length === 0 ? (
                      <SelectItem value="" disabled>
                        No templates available
                      </SelectItem>
                    ) : null}
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  onChange={(event) => {
                    const value = event.target.value;
                    setTextBody(value);
                    if (selectedTemplateId && htmlBody) {
                      setHtmlBody(null);
                    }
                  }}
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
