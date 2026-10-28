import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { ArrowLeft, DownloadSimple, Images, LinkSimple, Sparkle } from "@phosphor-icons/react";
import { Toaster, toast } from "sonner";
import { SidebarLayout } from "@/shared/components/SidebarLayout";
import { useIsMobile } from "@/shared/components/ui/use-mobile";
import { saveFile } from "@/shared/utils/saveFile";
import { FieldsPanel } from "./components/FieldsPanel";
import { Gallery } from "./components/Gallery";
import { Library } from "./components/Library";
import { PlannedCard } from "./components/PlannedCard";
import { PreviewPane, type PreviewHandle } from "./components/PreviewPane";
import { VIEW_KEYS, useFieldValues } from "./hooks/useFieldValues";
import { useImageIndex } from "./hooks/useImageIndex";
import { SITE_URL, aiPrompt, canonicalQuery, linkable, primaryImageField, renderPath } from "../params";
import { NOT_AN_IMAGE, fileIn, hasImageFile, readImage } from "./photo";
import type { ImageCategory, ImageProject } from "./types";

const EMPTY: ImageProject[] = [];
const NO_CATEGORIES: ImageCategory[] = [];

const fileName = (title: string) => `${title.replace(/[\\/:*?"<>|]+/g, "-").trim()}.jpg`;

export default function App() {
  const index = useImageIndex();
  const projects = index.status === "ready" ? index.projects : EMPTY;
  const categories = index.status === "ready" ? index.categories : NO_CATEGORIES;
  const [params, setParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const preview = useRef<PreviewHandle>(null);
  const isMobile = useIsMobile();

  // The image is ?template=<id> (?i=<id> in older links; the address bar moves it to template). With neither,
  // the page is the gallery of every image; an id that isn't there says so.
  const wanted = params.get("template") ?? params.get("i");
  const project = wanted ? (projects.find((p) => p.id === wanted) ?? null) : null;
  const missing = index.status === "ready" && !!wanted && !project;
  const templates = projects.filter((p) => p.group === "templates" && p.path);
  const planned = project?.status === "planned";
  const fields = useFieldValues(project);
  const photoField = project && !planned ? primaryImageField(project.fields) : undefined;
  const categoryLabel = categories.find((c) => c.id === project?.category)?.label;
  const templateTitle = project?.template && projects.find((p) => p.id === project.template)?.title;

  // A new image starts from its own values: only the Library's view (search and filters) stays in the URL.
  const viewParams = (id?: string) => {
    const next = new URLSearchParams(id ? { template: id } : {});
    for (const k of VIEW_KEYS) if (params.has(k)) next.set(k, params.get(k)!);
    return next;
  };
  /** From the sidebar: swap the image in place. */
  const select = (id: string) => setParams(viewParams(id), { replace: true });
  /** From the gallery, and back to it: new history entries, so the browser's Back goes where you were. */
  const open = (id: string) => setParams(viewParams(id));
  const toGallery = () => setParams(viewParams());

  /** An uploaded, dropped or pasted file for an image field; anything that isn't an image says so under it. */
  const takeFile = async (fieldId: string, file: File) => {
    try {
      fields.set(fieldId, await readImage(file), file.name);
    } catch {
      fields.setError(fieldId, NOT_AN_IMAGE);
    }
  };
  const takeFileRef = useRef(takeFile);
  takeFileRef.current = takeFile;

  // Paste an image anywhere on the page (⌘V / Ctrl+V) to use it as the photo; text pastes are left alone.
  useEffect(() => {
    if (!photoField) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = hasImageFile(e.clipboardData) ? fileIn(e.clipboardData) : null;
      if (!file) return;
      e.preventDefault();
      takeFileRef.current(photoField.id, file);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [photoField?.id, project?.id]);

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(done);
    } catch {
      toast.error("Couldn't copy: the browser blocked the clipboard.");
    }
  };

  const copyImageLink = () => {
    if (!project) return;
    const query = canonicalQuery(project.fields, linkable(fields.values));
    const upload = Object.keys(fields.values).length !== Object.keys(linkable(fields.values)).length;
    copy(
      `${window.location.origin}${renderPath(project.id)}${query ? `?${query}` : ""}`,
      upload ? "Copied without the photo: an uploaded file can't go in a link." : "Image link copied: it opens this image as a JPG.",
    );
  };

  const secondaryButtonClass =
    "flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border-subtle bg-surface-2 text-sm text-text-primary hover:border-brand hover:text-brand-light transition-colors";

  const aiButton = (label: string) => (
    <button
      onClick={() => copy(aiPrompt(templates, SITE_URL), "Prompt copied. Paste it into any AI chat and say what you need.")}
      title="Copy a prompt that lets any AI chat make these images for you"
      className={secondaryButtonClass}
    >
      <Sparkle size={16} weight="bold" />
      <span className={label}>Use with AI</span>
    </button>
  );

  const linkButtons = (
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={copyImageLink} title="Copy a link that renders this image, with these values, as a JPG" className={secondaryButtonClass}>
        <LinkSimple size={16} weight="bold" />
        <span className="hidden min-[1400px]:inline">Copy image link</span>
      </button>
      {aiButton("hidden min-[1400px]:inline")}
    </div>
  );

  const download = async () => {
    if (!project || !preview.current) return;
    setExporting(true);
    try {
      await saveFile(await preview.current.exportJpg(), fileName(project.title));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const downloadButton = (
    <button
      onClick={download}
      disabled={!project || exporting}
      className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
    >
      <DownloadSimple size={16} weight="bold" />
      {exporting ? "Exporting…" : "Download JPG"}
    </button>
  );

  const fieldsPanel = (inDrawer: boolean) =>
    project &&
    !planned && (
      <FieldsPanel
        project={project}
        values={fields.values}
        names={fields.names}
        errors={fields.errors}
        unknown={fields.unknown}
        edited={fields.edited}
        onChange={fields.set}
        onFile={takeFile}
        onError={fields.setError}
        onReset={fields.reset}
        inDrawer={inDrawer}
      />
    );

  // No image picked: the gallery, full width, its filters on top.
  if (!wanted)
    return (
      <>
        <Toaster position="top-center" richColors />
        {index.status === "ready" ? (
          <Gallery projects={projects} categories={categories} onOpen={open} action={aiButton("hidden sm:inline")} />
        ) : (
          <p className="p-4 md:p-8 text-sm text-text-dim bg-bg h-full">
            {index.status === "loading" ? "Loading images…" : `Couldn't load the image index (${index.error}). Run npm run image:index.`}
          </p>
        )}
      </>
    );

  // Phones: the preview fills the screen; the drawer holds the Library and the fields,
  // and Download sits in the bottom bar.
  return (
    <>
      <Toaster position="top-center" richColors />
      <SidebarLayout
        sidebar={<Library projects={projects} categories={categories} selectedId={project?.id ?? null} onSelect={select} />}
        drawerTitle="Images"
        drawerContent={
          <>
            {fieldsPanel(true)}
            <div className="border-t border-border-subtle">
              <Library
                projects={projects}
                categories={categories}
                selectedId={project?.id ?? null}
                inDrawer
                onSelect={(id) => {
                  select(id);
                  setDrawerOpen(false);
                }}
              />
            </div>
          </>
        }
        drawerOpen={drawerOpen}
        onDrawerOpenChange={setDrawerOpen}
        editLabel="Edit"
        editIcon={Images}
        attention={Object.keys(fields.errors).length > 0 || fields.unknown.length > 0}
        barAction={project && !planned ? downloadButton : undefined}
      >
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          {project && (
            <div className="flex items-center gap-4 px-4 md:px-6 py-3 border-b border-border-subtle shrink-0">
              <button
                onClick={toGallery}
                title="All images"
                aria-label="All images"
                className="shrink-0 -ml-1.5 p-1.5 rounded-lg text-text-dim hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                <ArrowLeft size={18} weight="bold" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm text-text-primary font-semibold truncate">{project.title}</h1>
                <p className="text-[11px] text-text-dim font-mono truncate">
                  {project.id} · {project.width}×{project.height}
                  {project.source ? ` · from ${project.source}` : ""}
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-1.5 shrink-0 text-[11px] font-mono text-text-dim">
                {[categoryLabel, templateTitle && `Template: ${templateTitle}`, project.series].filter(Boolean).map((chip) => (
                  <span key={chip as string} className="px-2 py-0.5 rounded-md border border-border-subtle">
                    {chip}
                  </span>
                ))}
              </div>
              {!planned && linkButtons}
              {!isMobile && !planned && downloadButton}
            </div>
          )}

          <div className="flex-1 min-h-0 flex">
            {index.status === "loading" && <p className="p-4 md:p-8 text-sm text-text-dim">Loading images…</p>}
            {index.status === "error" && (
              <p className="p-4 md:p-8 text-sm text-text-dim">
                Couldn't load the image index ({index.error}). Run{" "}
                <span className="font-mono text-text-primary">npm run image:index</span>.
              </p>
            )}
            {missing && (
              <p className="p-4 md:p-8 text-sm text-red-400">
                No template named "{wanted}". Available: {templates.map((t) => t.id).join(", ")}.{" "}
                <button onClick={toGallery} className="text-brand-light hover:underline">
                  See all images
                </button>
              </p>
            )}
            {index.status === "ready" && !project && !missing && <p className="p-4 md:p-8 text-sm text-text-dim">No image projects yet.</p>}
            {project && planned && <PlannedCard project={project} categories={categories} projects={projects} />}
            {project && !planned && (
              // Drop a photo on the preview to use it (the iframe ignores the pointer, so the drop lands here).
              // Click a text or photo on it to edit it there; a download ends that first, like Market Map's.
              <div
                className="relative flex-1 min-w-0 min-h-0 flex"
                onDragOver={(e) => {
                  if (!photoField) return;
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = fileIn(e.dataTransfer);
                  if (file && photoField) takeFile(photoField.id, file);
                }}
              >
                <PreviewPane
                  ref={preview}
                  project={project}
                  values={fields.values}
                  edit={
                    exporting
                      ? undefined
                      : { names: fields.names, errors: fields.errors, onChange: fields.set, onFile: takeFile }
                  }
                />
                {dragging && photoField && (
                  <div className="absolute inset-4 rounded-xl border-2 border-dashed border-brand bg-brand/10 flex items-center justify-center text-sm text-text-primary pointer-events-none">
                    Drop to use as the {photoField.label.toLowerCase()}
                  </div>
                )}
              </div>
            )}
            {project && !isMobile && fieldsPanel(false)}
          </div>
        </div>
      </SidebarLayout>
    </>
  );
}
