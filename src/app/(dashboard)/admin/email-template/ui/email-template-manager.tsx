"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  CreateEmailTemplateState,
  EmailTemplateSummary,
  createEmailTemplateAction,
  deleteEmailTemplateAction
} from "@/server/email-templates/actions";

import "quill/dist/quill.snow.css";

type QuillEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type QuillToolbarModule = {
  addHandler: (name: string, handler: (...args: unknown[]) => void) => void;
  container?: HTMLElement;
};

type QuillRange = {
  index: number;
  length: number;
};

type QuillWhitelistAttributor = {
  whitelist: string[] | undefined;
};

const FONT_FAMILIES = [
  {
    label: "Sofia Pro",
    value: "Sofia Pro",
    css: '"Sofia Pro", "Helvetica", "Arial", sans-serif'
  },
  {
    label: "Slabo 13px",
    value: "Slabo 13px",
    css: '"Slabo 13px", "Times New Roman", serif'
  },
  {
    label: "Roboto Slab",
    value: "Roboto Slab",
    css: '"Roboto Slab", "Roboto", "Helvetica", sans-serif'
  },
  {
    label: "Inconsolata",
    value: "Inconsolata",
    css: '"Inconsolata", "Courier New", monospace'
  },
  {
    label: "Ubuntu Mono",
    value: "Ubuntu Mono",
    css: '"Ubuntu Mono", "Courier New", monospace'
  },
  {
    label: "Georgia",
    value: "Georgia",
    css: '"Georgia", serif'
  },
  {
    label: "Arial",
    value: "Arial",
    css: '"Arial", "Helvetica", sans-serif'
  },
  {
    label: "Verdana",
    value: "Verdana",
    css: '"Verdana", "Geneva", sans-serif'
  }
];

const FONT_SIZE_OPTIONS = ["12px", "14px", "16px", "18px", "24px", "32px"];

const COLOR_OPTIONS = [
  "#000000",
  "#E60000",
  "#FF9900",
  "#FFFF00",
  "#008A00",
  "#0066CC",
  "#9933FF",
  "#FFFFFF",
  "#FACC66",
  "#FFEBCC",
  "#FFFFCC",
  "#CCE8CC",
  "#CCE0F5",
  "#EBD6FF",
  "#BBBBBB",
  "#F06666",
  "#FFC266",
  "#FFFF66",
  "#66B966",
  "#66A3E0",
  "#C285FF",
  "#888888",
  "#A10000",
  "#B26B00",
  "#B2B200",
  "#006100",
  "#0047B2",
  "#6B24B2",
  "#444444",
  "#5C0000",
  "#663D00",
  "#666600",
  "#003700",
  "#002966",
  "#3D1466",
  "#F9C801"
];

const toolbarOptions = [
  [
    { font: FONT_FAMILIES.map((font) => font.value) },
    { size: FONT_SIZE_OPTIONS }
  ],
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "image", "blockquote", "code-block"],
  [{ align: [] }],
  [{ color: COLOR_OPTIONS }, { background: [] }, "customColor"],
  ["clean"]
];

let quillFormattingRegistered = false;
let quillToolbarStylesInjected = false;

const DEFAULT_TEXT_COLOR = "#000000";

const EDITOR_SCROLL_HEIGHT = 360;

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

const enforceImageSize = (root: HTMLElement) => {
  const images = root.querySelectorAll<HTMLImageElement>("img");
  images.forEach((image) => {
    image.width = 100;
    image.height = 100;
    image.style.width = "100px";
    image.style.height = "100px";
    image.style.objectFit = "contain";
    image.style.display = "inline-block";
  });
};

const QuillEditor = ({ value, onChange }: QuillEditorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any>(null);
  const handlerRef = useRef<(() => void) | null>(null);
  const customColorInputRef = useRef<HTMLInputElement | null>(null);
  const customColorChangeHandlerRef = useRef<((event: Event) => void) | null>(
    null
  );
  const customColorSelectionRef = useRef<QuillRange | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const { default: Quill } = await import("quill");
      if (!isMounted || !containerRef.current) {
        return;
      }

      if (!quillFormattingRegistered) {
        const Font = Quill.import("attributors/style/font");
        (Font as unknown as QuillWhitelistAttributor).whitelist =
          FONT_FAMILIES.map((font) => font.value);
        // @ts-ignore
        Quill.register(Font, true);

        const Size = Quill.import("attributors/style/size");
        (Size as unknown as QuillWhitelistAttributor).whitelist =
          FONT_SIZE_OPTIONS;
        // @ts-ignore
        Quill.register(Size, true);

        const Color = Quill.import("attributors/style/color");
        (Color as unknown as QuillWhitelistAttributor).whitelist =
          COLOR_OPTIONS;
        // @ts-ignore
        Quill.register(Color, true);

        quillFormattingRegistered = true;
      }

      if (!quillToolbarStylesInjected && typeof document !== "undefined") {
        const styleElement = document.createElement("style");
        styleElement.setAttribute("data-email-template-toolbar", "true");
        const fontStyleRules = FONT_FAMILIES.map(
          (font) => `
            .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="${font.value}"]::before,
            .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="${font.value}"]::before {
              content: "${font.label}";
              font-family: ${font.css};
            }
            .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="${font.value}"],
            .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="${font.value}"] {
              font-family: ${font.css};
            }
          `
        ).join("\n");

        const sizeStyleRules = FONT_SIZE_OPTIONS.map(
          (size) => `
            .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="${size}"]::before,
            .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="${size}"]::before {
              content: "${size}";
            }
            .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="${size}"],
            .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="${size}"] {
              font-size: ${size};
              line-height: 1.2;
            }
          `
        ).join("\n");
        styleElement.textContent = `
          .ql-snow .ql-toolbar button.ql-customColor::before {
            content: "Clr";
            font-size: 11px;
            letter-spacing: 0.05em;
          }
          .ql-snow .ql-toolbar button.ql-customColor {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 2.5rem;
          }
          ${fontStyleRules}
          ${sizeStyleRules}
        `;
        document.head.appendChild(styleElement);
        quillToolbarStylesInjected = true;
      }

      const quillInstance = new Quill(containerRef.current, {
        theme: "snow",
        modules: {
          toolbar: toolbarOptions
        }
      });

      quillRef.current = quillInstance;

      // Keep the editor height fixed and make the inner content scrollable.
      const editorContainer = quillInstance.root
        .parentElement as HTMLElement | null;
      if (editorContainer) {
        editorContainer.style.height = `${EDITOR_SCROLL_HEIGHT}px`;
        editorContainer.style.maxHeight = `${EDITOR_SCROLL_HEIGHT}px`;
        editorContainer.style.overflowY = "hidden";
      }

      const editorElement = quillInstance.root as HTMLElement;
      editorElement.style.height = "100%";
      editorElement.style.maxHeight = "100%";
      editorElement.style.overflowY = "auto";

      if (value) {
        quillInstance.clipboard.dangerouslyPasteHTML(value);
        enforceImageSize(quillInstance.root);
      }

      const handleChange = () => {
        const html = quillInstance.root.innerHTML;
        onChange(normalizeHtml(html));
      };

      handlerRef.current = handleChange;
      quillInstance.on("text-change", handleChange);

      const toolbar = quillInstance.getModule("toolbar") as
        | QuillToolbarModule
        | undefined;
      if (toolbar && typeof window !== "undefined") {
        const toolbarElement = toolbar.container;

        if (toolbarElement) {
          const customColorButton =
            toolbarElement.querySelector<HTMLButtonElement>(
              "button.ql-customColor"
            );
          if (customColorButton) {
            customColorButton.setAttribute("type", "button");
            customColorButton.setAttribute("title", "Custom text color");
            customColorButton.setAttribute("aria-label", "Custom text color");
          }
        }

        const ensureCustomColorInput = () => {
          if (typeof document === "undefined") {
            return null;
          }
          if (!customColorInputRef.current) {
            const input = document.createElement("input");
            input.type = "color";
            input.style.position = "fixed";
            input.style.left = "-10000px";
            const handleColorChange = (event: Event) => {
              const target = event.target as HTMLInputElement;
              const nextColor = target.value || DEFAULT_TEXT_COLOR;

              const selection = customColorSelectionRef.current;
              if (selection) {
                quillInstance.setSelection(selection);
              }

              quillInstance.focus();
              quillInstance.format("color", nextColor);
              customColorSelectionRef.current = null;
            };
            customColorChangeHandlerRef.current = handleColorChange;
            input.addEventListener("change", handleColorChange);
            document.body.appendChild(input);
            customColorInputRef.current = input;
          }
          return customColorInputRef.current;
        };

        const resolveHexColor = (color: unknown) => {
          if (typeof color !== "string") {
            return DEFAULT_TEXT_COLOR;
          }
          if (/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(color)) {
            return color;
          }
          const match = color.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/i);
          if (match) {
            const [red, green, blue] = match
              .slice(1, 4)
              .map((component) =>
                Math.min(255, Math.max(0, Number.parseInt(component, 10)))
              );
            const toHex = (value: number) =>
              value.toString(16).padStart(2, "0");
            return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
          }
          return DEFAULT_TEXT_COLOR;
        };

        toolbar.addHandler("customColor", () => {
          const selection =
            quillInstance.getSelection() ??
            ({
              index: quillInstance.getLength(),
              length: 0
            } as QuillRange);

          customColorSelectionRef.current = {
            index: selection.index,
            length: selection.length
          };

          const input = ensureCustomColorInput();
          if (!input) {
            return;
          }

          const format = quillInstance.getFormat() as { color?: string };
          const currentColor = resolveHexColor(format.color);

          quillInstance.focus();
          input.value = currentColor;
          input.click();
        });

        toolbar.addHandler("image", () => {
          const rawUrl = window.prompt("Paste the image URL");
          if (!rawUrl) {
            return;
          }

          const url = rawUrl.trim();
          if (!/^https?:\/\/.+/i.test(url)) {
            toast.error(
              "Provide a valid image URL starting with http or https."
            );
            return;
          }

          const selection = quillInstance.getSelection();
          const index = selection ? selection.index : quillInstance.getLength();

          quillInstance.insertEmbed(index, "image", url, "user");
          enforceImageSize(quillInstance.root);

          const leaf = quillInstance.getLeaf(index);
          if (leaf && leaf[0] && leaf[0].domNode instanceof HTMLImageElement) {
            const img = leaf[0].domNode as HTMLImageElement;
            img.width = 100;
            img.height = 100;
            img.style.width = "100px";
            img.style.height = "100px";
            img.style.objectFit = "contain";
            img.style.display = "inline-block";
          }

          quillInstance.setSelection(index + 1);
        });
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (quillRef.current && handlerRef.current) {
        quillRef.current.off("text-change", handlerRef.current);
      }
      if (customColorInputRef.current && customColorChangeHandlerRef.current) {
        customColorInputRef.current.removeEventListener(
          "change",
          customColorChangeHandlerRef.current
        );
      }
      if (customColorInputRef.current) {
        customColorInputRef.current.remove();
      }

      quillRef.current = null;
      handlerRef.current = null;
      customColorInputRef.current = null;
      customColorChangeHandlerRef.current = null;
      customColorSelectionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }

    const currentHtml = quill.root.innerHTML;
    enforceImageSize(quill.root);
    const normalizedCurrent = normalizeHtml(currentHtml);
    const normalizedValue = normalizeHtml(value);

    if (normalizedValue !== normalizedCurrent) {
      const selection = quill.getSelection();
      quill.clipboard.dangerouslyPasteHTML(value || "");
      enforceImageSize(quill.root);
      if (selection) {
        quill.setSelection(selection);
      }
    }
  }, [value]);

  return <div ref={containerRef} className="min-h-[360px]" />;
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
  const [templateName, setTemplateName] = useState("");
  const [subject, setSubject] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(
    null
  );
  const [body, setBody] = useState("");
  const wasEditingOnSubmit = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDeletePending, startDeleteTransition] = useTransition();

  const [state, formAction, isPending] = useActionState<
    CreateEmailTemplateState,
    FormData
  >(createEmailTemplateAction, createEmailTemplateInitialState);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (state.success) {
      const template = state.template;

      if (template) {
        setTemplates((prev) => [
          template,
          ...prev.filter((tpl) => tpl.id !== template.id)
        ]);
      }

      const wasEditing = wasEditingOnSubmit.current;
      setBody("");
      setTemplateName("");
      setSubject("");
      setEditingTemplateId(null);
      formRef.current?.reset();
      wasEditingOnSubmit.current = false;
      toast.success(
        wasEditing ? "Email template updated" : "Email template saved"
      );
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

  const handleFormSubmit = () => {
    wasEditingOnSubmit.current = editingTemplateId !== null;
  };

  const handleEditTemplate = (template: EmailTemplateSummary) => {
    setTemplateName(template.templateName);
    setSubject(template.subject);
    setBody(template.bodyHtml);
    setEditingTemplateId(template.id);
    wasEditingOnSubmit.current = false;
    if (isPreviewOpen) {
      setIsPreviewOpen(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTemplateId(null);
    setTemplateName("");
    setSubject("");
    setBody("");
    formRef.current?.reset();
    wasEditingOnSubmit.current = false;
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (isDeletePending && deletingTemplateId === templateId) {
      return;
    }

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Delete this template permanently? This action cannot be undone."
      );
      if (!confirmed) {
        return;
      }
    }

    setDeletingTemplateId(templateId);
    startDeleteTransition(() => {
      deleteEmailTemplateAction(templateId)
        .then((result) => {
          if (!result.success) {
            toast.error(
              result.error ??
                "Unable to delete email template. Try again later."
            );
            return;
          }

          setTemplates((prev) => prev.filter((tpl) => tpl.id !== templateId));

          if (editingTemplateId === templateId) {
            setEditingTemplateId(null);
            setTemplateName("");
            setSubject("");
            setBody("");
            formRef.current?.reset();
            wasEditingOnSubmit.current = false;
          }

          toast.success("Email template deleted");
        })
        .catch((error) => {
          console.error("[email-template] delete error", error);
          toast.error("Unable to delete email template. Try again later.");
        })
        .finally(() => {
          setDeletingTemplateId(null);
        });
    });
  };

  const renderTextPreview = (html: string) =>
    normalizeHtml(html)
      .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, "[Image: $1]")
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
            onSubmit={handleFormSubmit}
            className="grid gap-4"
            autoComplete="off"
          >
            {editingTemplateId ? (
              <input type="hidden" name="templateId" value={editingTemplateId} />
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="templateName">Template name</Label>
              <Input
                id="templateName"
                name="templateName"
                type="text"
                placeholder="Welcome follow-up"
                required
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
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
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
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
                    Initializing editor...
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Format your email using the editor. Inline styles are stored for
                HTML emails, and a plain-text version is generated
                automatically.
              </p>
            </div>

            {state.error ? (
              <p className="text-sm text-rose-600">{state.error}</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handlePreview}
                disabled={isPending}
              >
                Preview
              </Button>
              <div className="flex items-center gap-2">
                {editingTemplateId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isPending}
                  >
                    Cancel edit
                  </Button>
                ) : null}
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Spinner className="mr-2 text-white" />
                      {editingTemplateId ? "Updating..." : "Saving..."}
                    </>
                  ) : editingTemplateId ? (
                    "Update template"
                  ) : (
                    "Save template"
                  )}
                </Button>
              </div>
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
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
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTemplate(template)}
                        disabled={
                          isPending ||
                          (isDeletePending && deletingTemplateId === template.id)
                        }
                        aria-label="Edit template"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-rose-500 hover:text-rose-600 focus-visible:ring-rose-500"
                        onClick={() => handleDeleteTemplate(template.id)}
                        disabled={
                          isPending ||
                          (isDeletePending && deletingTemplateId === template.id)
                        }
                        aria-label="Delete template"
                      >
                        {isDeletePending && deletingTemplateId === template.id ? (
                          <Spinner className="text-rose-500" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
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
                  Preview —{" "}
                  {normalizeHtml(body) ? "Template" : "Empty template"}
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
