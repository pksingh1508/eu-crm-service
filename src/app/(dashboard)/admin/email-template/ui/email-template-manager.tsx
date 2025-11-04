"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  CreateEmailTemplateState,
  EmailTemplateSummary,
  createEmailTemplateAction
} from "@/server/email-templates/actions";

import "quill/dist/quill.snow.css";

type QuillEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "blockquote", "code-block"],
  [{ align: [] }],
  [{ color: [] }, { background: [] }],
  ["clean"]
];

const normalizeHtml = (html: string) => {
  const trimmed = html.trim();
  if (
    trimmed === "" ||
    trimmed === "<p><br></p>" ||
    trimmed === "<p></p>" ||
    trimmed === "<div><br></div>"
  ) {
    return "";
  }
  return trimmed;
};

const QuillEditor = ({ value, onChange }: QuillEditorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any>(null);
  const handlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const { default: Quill } = await import("quill");
      if (!isMounted || !containerRef.current) {
        return;
      }

      const quillInstance = new Quill(containerRef.current, {
        theme: "snow",
        modules: {
          toolbar: toolbarOptions
        }
      });

      quillRef.current = quillInstance;

      if (value) {
        quillInstance.clipboard.dangerouslyPasteHTML(value);
      }

      const handleChange = () => {
        const html = quillInstance.root.innerHTML;
        onChange(normalizeHtml(html));
      };

      handlerRef.current = handleChange;
      quillInstance.on("text-change", handleChange);
    };

    initialize();

    return () => {
      isMounted = false;
      if (quillRef.current && handlerRef.current) {
        quillRef.current.off("text-change", handlerRef.current);
      }
      quillRef.current = null;
      handlerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }

    const currentHtml = quill.root.innerHTML;
    const normalizedCurrent = normalizeHtml(currentHtml);
    const normalizedValue = normalizeHtml(value);

    if (normalizedValue !== normalizedCurrent) {
      const selection = quill.getSelection();
      quill.clipboard.dangerouslyPasteHTML(value || "");
      if (selection) {
        quill.setSelection(selection);
      }
    }
  }, [value]);

  return <div ref={containerRef} className="min-h-[280px]" />;
};

type EmailTemplateManagerProps = {
  initialTemplates: EmailTemplateSummary[];
};

const createEmailTemplateInitialState: CreateEmailTemplateState = {
  success: false,
  error: undefined,
  template: undefined
};

const EmailTemplateManager = ({
  initialTemplates
}: EmailTemplateManagerProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [templates, setTemplates] =
    useState<EmailTemplateSummary[]>(initialTemplates);
  const [body, setBody] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const [state, formAction, isPending] = useActionState<
    CreateEmailTemplateState,
    FormData
  >(createEmailTemplateAction, createEmailTemplateInitialState);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (state.success) {
      if (state.template) {
        setTemplates((prev) => [
          state.template!,
          ...prev.filter((tpl) => tpl.id !== state.template!.id)
        ]);
      }
      setBody("");
      formRef.current?.reset();
      toast.success("Email template saved");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state.success, state.error, state.template]);

  const latestTemplates = useMemo(() => {
    return [...templates].sort(
      (a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [templates]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<"html" | "text">("html");

  const handlePreview = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!normalizeHtml(body)) {
      toast.info("Add some content before previewing.");
      return;
    }
    setPreviewTab("html");
    setIsPreviewOpen(true);
  };

  const closePreview = () => setIsPreviewOpen(false);

const renderTextPreview = (html: string) =>
  normalizeHtml(html)
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

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(new Date(value));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">
            Create a new template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            action={formAction}
            className="grid gap-4"
            autoComplete="off"
          >
            <div className="grid gap-2">
              <Label htmlFor="templateName">Template name</Label>
              <Input
                id="templateName"
                name="templateName"
                type="text"
                placeholder="Welcome follow-up"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject">Subject line</Label>
              <Input
                id="subject"
                name="subject"
                type="text"
                placeholder="Welcome to EU Prime Serwis"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Email body</Label>
              <input type="hidden" name="body" value={body} readOnly />
              {isMounted ? (
                <QuillEditor value={body} onChange={setBody} />
              ) : (
                <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                  <Spinner className="mr-2 text-slate-600" />
                  <span className="text-sm text-slate-600">
                    Initializing editor…
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Format your email using the editor. Inline styles are stored for
                HTML emails, and a plain-text version is generated automatically.
              </p>
            </div>

            {state.error ? (
              <p className="text-sm text-rose-600">{state.error}</p>
            ) : null}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handlePreview}
              >
                Preview
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Spinner className="mr-2 text-white" />
                    Saving…
                  </>
                ) : (
                  "Save template"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">
            Recent templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestTemplates.length === 0 ? (
            <p className="text-sm text-slate-600">
              No templates saved yet. Create your first template using the form.
            </p>
          ) : (
            <ul className="space-y-4">
              {latestTemplates.map((template) => (
                <li
                  key={template.id}
                  className="rounded-lg border border-slate-200 p-4 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-slate-900">
                    {template.templateName}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Subject:{" "}
                    <span className="font-medium text-slate-700">
                      {template.subject}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Updated {formatTimestamp(template.updatedAt)} UTC
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-full w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Preview — {normalizeHtml(body) ? "Template" : "Empty template"}
                </h2>
                <p className="text-xs text-slate-500">
                  Switch between HTML and plain-text views.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs">
                  <button
                    type="button"
                    className={`rounded px-3 py-1 ${
                      previewTab === "html"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                    }`}
                    onClick={() => setPreviewTab("html")}
                  >
                    HTML
                  </button>
                  <button
                    type="button"
                    className={`rounded px-3 py-1 ${
                      previewTab === "text"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                    }`}
                    onClick={() => setPreviewTab("text")}
                  >
                    Plain text
                  </button>
                </div>
                <Button type="button" variant="ghost" onClick={closePreview}>
                  Close
                </Button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              {normalizeHtml(body) ? (
                previewTab === "html" ? (
                  <div
                    className="prose max-w-none text-sm text-slate-800"
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap rounded-lg bg-slate-100 p-4 text-sm text-slate-800">
                    {renderTextPreview(body)}
                  </pre>
                )
              ) : (
                <p className="text-sm text-slate-500">
                  Add content in the editor to preview it here.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EmailTemplateManager;
