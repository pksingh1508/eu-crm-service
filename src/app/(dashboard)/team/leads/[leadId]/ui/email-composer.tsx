'use client'

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useAuthStore } from "@/stores/auth-store"
import { useUiStore } from "@/stores/ui-store"
import type { EmailTemplate } from "@/constants/email-templates"

type LeadInfo = {
  id: string
  name: string
  email: string | null
}

type EmailComposerProps = {
  lead: LeadInfo
  workspaceEmailId: string | null
  templates: EmailTemplate[]
}

const EmailComposer = ({
  lead,
  workspaceEmailId,
  templates
}: EmailComposerProps) => {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { isEmailComposerOpen, activeLeadId, closeEmailComposer } =
    useUiStore()

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  )
  const [subject, setSubject] = useState("")
  const [textBody, setTextBody] = useState("")
  const [htmlBody, setHtmlBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isOpen = isEmailComposerOpen && activeLeadId === lead.id

  const senderName = useMemo(() => {
    if (user?.email) {
      const [localPart] = user.email.split("@")
      return localPart.replace(".", " ")
    }
    return "Team member"
  }, [user?.email])

  const leadName = lead.name ?? lead.email ?? "there"

  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplateId(null)
      setSubject("")
      setTextBody("")
      setHtmlBody("")
      setFeedback(null)
      setError(null)
    }
  }, [isOpen])

  const applyTemplate = (templateId: string) => {
    const template = templates.find((tpl) => tpl.id === templateId)
    if (!template) {
      return
    }

    const replacements: Record<string, string> = {
      "{{leadName}}": leadName,
      "{{senderName}}": senderName
    }

    const replacePlaceholders = (content: string) =>
      Object.entries(replacements).reduce(
        (acc, [token, value]) => acc.replaceAll(token, value),
        content
      )

    setSubject(replacePlaceholders(template.subject))
    setTextBody(replacePlaceholders(template.textBody))
    setHtmlBody(replacePlaceholders(template.htmlBody))
  }

  const handleTemplateChange = (value: string) => {
    setSelectedTemplateId(value)
    applyTemplate(value)
  }

  const handleSend = async () => {
    if (!workspaceEmailId) {
      setError(
        "No workspace mailbox is assigned to you. Contact an administrator."
      )
      return
    }
    if (!subject.trim() || (!textBody.trim() && !htmlBody.trim())) {
      setError("Please provide a subject and at least one body format.")
      return
    }

    setIsSending(true)
    setError(null)
    setFeedback(null)

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          leadId: lead.id,
          subject,
          textBody,
          htmlBody,
          workspaceEmailId
        })
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.message ?? "Failed to send email.")
      }

      setFeedback("Email sent successfully.")
      toast.success("Email sent successfully.")
      router.refresh()
      setTimeout(() => {
        closeEmailComposer()
      }, 800)
    } catch (err) {
      console.error("[email-composer] send failed", err)
      setError(
        err instanceof Error
          ? err.message
          : "Unexpected error while sending email."
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeEmailComposer}>
      <DialogContent className="max-w-2xl sm:max-w-3xl w-[95vw] overflow-hidden p-0">
        <div className="flex max-h-[calc(100vh-4rem)] flex-col">
          <div className="space-y-2 border-b border-slate-200 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle>Send email to {lead.name ?? lead.email}</DialogTitle>
              <DialogDescription>
                Use a template or write from scratch. Emails send via your assigned workspace mailbox.
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
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="subject" className="text-sm font-medium text-slate-700">
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
                <label htmlFor="textBody" className="text-sm font-medium text-slate-700">
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

              <div className="grid gap-2">
                <label htmlFor="htmlBody" className="text-sm font-medium text-slate-700">
                  HTML body (optional)
                </label>
                <Textarea
                  id="htmlBody"
                  value={htmlBody}
                  onChange={(event) => setHtmlBody(event.target.value)}
                  rows={6}
                  placeholder="<p>Hello...</p>"
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Preview
                </p>
                <div className="mt-2 grid gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Plain text</p>
                    <div className="mt-1 whitespace-pre-wrap rounded-md bg-white p-3 text-sm text-slate-700 shadow-inner">
                      {textBody.trim().length > 0
                        ? textBody
                        : "Start typing above or choose a template to generate content."}
                    </div>
                  </div>
                  {htmlBody.trim().length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-slate-500">HTML</p>
                      <div
                        className="mt-1 rounded-md bg-white p-3 text-sm text-slate-700 shadow-inner"
                        dangerouslySetInnerHTML={{ __html: htmlBody }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {error ? (
                <p className="text-sm text-rose-600">{error}</p>
              ) : null}
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
  )
}

export default EmailComposer
