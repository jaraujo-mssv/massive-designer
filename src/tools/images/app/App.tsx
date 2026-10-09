import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { DownloadSimple, Images } from "@phosphor-icons/react";
import { Toaster, toast } from "sonner";
import { SidebarLayout } from "@/shared/components/SidebarLayout";
import { useIsMobile } from "@/shared/components/ui/use-mobile";
import { saveFile } from "@/shared/utils/saveFile";
import { FieldsPanel } from "./components/FieldsPanel";
import { Library } from "./components/Library";
import { PreviewPane, type PreviewHandle } from "./components/PreviewPane";
import { useFieldValues } from "./hooks/useFieldValues";
import { useImageIndex } from "./hooks/useImageIndex";
import type { ImageProject } from "./types";

const EMPTY: ImageProject[] = [];

const fileName = (title: string) => `${title.replace(/[\\/:*?"<>|]+/g, "-").trim()}.jpg`;

export default function App() {
  const index = useImageIndex();
  const projects = index.status === "ready" ? index.projects : EMPTY;
  const [params, setParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const preview = useRef<PreviewHandle>(null);
  const isMobile = useIsMobile();

  const project = projects.find((p) => p.id === params.get("i")) ?? projects[0] ?? null;
  const fields = useFieldValues(project);

  const select = (id: string) => {
    const p = new URLSearchParams(params);
    p.set("i", id);
    setParams(p, { replace: true });
  };

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
    project && (
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
        sidebar={<Library projects={projects} selectedId={project?.id ?? null} onSelect={select} />}
        drawerTitle="Images"
        drawerContent={
          <>
            {fieldsPanel(true)}
            <div className="border-t border-border-subtle">
              <Library
                projects={projects}
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
        barAction={project ? downloadButton : undefined}
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
              {!isMobile && downloadButton}
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
            {project && <PreviewPane ref={preview} project={project} values={fields.values} />}
            {project && !isMobile && fieldsPanel(false)}
          </div>
        </div>
      </SidebarLayout>
    </>
  );
}
