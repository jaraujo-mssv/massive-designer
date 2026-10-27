import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { DownloadSimple, Images, LinkSimple, Sparkle } from "@phosphor-icons/react";
import { Toaster, toast } from "sonner";
import { SidebarLayout } from "@/shared/components/SidebarLayout";
import { useIsMobile } from "@/shared/components/ui/use-mobile";
import { saveFile } from "@/shared/utils/saveFile";
import { FieldsPanel } from "./components/FieldsPanel";
import { Library } from "./components/Library";
import { PlannedCard } from "./components/PlannedCard";
import { PreviewPane, type PreviewHandle } from "./components/PreviewPane";
import { useFieldValues } from "./hooks/useFieldValues";
import { useImageIndex } from "./hooks/useImageIndex";
import { AI_PROMPT, RESERVED_PARAMS, canonicalQuery, readParams, renderPath } from "../params";
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
  const preview = useRef<PreviewHandle>(null);
  const isMobile = useIsMobile();

  // With nothing picked, open the first real image rather than a Planned entry.
  const project = projects.find((p) => p.id === params.get("i")) ?? projects.find((p) => p.path) ?? projects[0] ?? null;
  const planned = project?.status === "planned";
  const fields = useFieldValues(project);
  const categoryLabel = categories.find((c) => c.id === project?.category)?.label;
  const templateTitle = project?.template && projects.find((p) => p.id === project.template)?.title;

  const select = (id: string) => {
    const p = new URLSearchParams(params);
    p.set("i", id);
    setParams(p, { replace: true });
  };

  // An edit link (/images?i=<id>&headline=…, as llms.txt teaches AI chats) fills in the fields as edits,
  // then its values leave the URL so they don't follow you around the Library.
  useEffect(() => {
    if (!project || planned) return;
    const keys = [...params.keys()].filter((k) => !RESERVED_PARAMS.includes(k));
    if (!keys.length) return;
    const { values, errors } = readParams(project.fields, params);
    fields.merge(values);
    if (errors.length) toast.error(errors.join(" "));
    const next = new URLSearchParams(params);
    for (const k of keys) next.delete(k);
    setParams(next, { replace: true });
    // Only when the image or the URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, params]);

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
    if (project.fields.some((f) => f.type === "image" && String(fields.values[f.id] ?? "").startsWith("data:"))) {
      toast.error("An uploaded photo can't go in a link. Use a photo that's online, or download the JPG.");
      return;
    }
    const query = canonicalQuery(project.fields, fields.values);
    copy(`${window.location.origin}${renderPath(project.id)}${query ? `?${query}` : ""}`, "Image link copied: it opens this image as a JPG.");
  };

  const secondaryButtonClass =
    "flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border-subtle bg-surface-2 text-sm text-text-primary hover:border-brand hover:text-brand-light transition-colors";

  const linkButtons = (
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={copyImageLink} title="Copy a link that renders this image, with these values, as a JPG" className={secondaryButtonClass}>
        <LinkSimple size={16} weight="bold" />
        <span className="hidden min-[1400px]:inline">Copy image link</span>
      </button>
      <button
        onClick={() => copy(AI_PROMPT, "Prompt copied. Paste it into any AI chat and say what you need.")}
        title="Copy a prompt that lets any AI chat make these images for you"
        className={secondaryButtonClass}
      >
        <Sparkle size={16} weight="bold" />
        <span className="hidden min-[1400px]:inline">Use with AI</span>
      </button>
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
        edited={fields.edited}
        onChange={fields.set}
        onReset={fields.reset}
        inDrawer={inDrawer}
      />
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
        barAction={project && !planned ? downloadButton : undefined}
      >
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          {project && (
            <div className="flex items-center gap-4 px-4 md:px-6 py-3 border-b border-border-subtle shrink-0">
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
            {index.status === "ready" && !project && <p className="p-4 md:p-8 text-sm text-text-dim">No image projects yet.</p>}
            {project && planned && <PlannedCard project={project} categories={categories} projects={projects} />}
            {project && !planned && <PreviewPane ref={preview} project={project} values={fields.values} />}
            {project && !isMobile && fieldsPanel(false)}
          </div>
        </div>
      </SidebarLayout>
    </>
  );
}
