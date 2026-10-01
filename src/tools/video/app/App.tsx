import { useState } from "react";
import { useSearchParams } from "react-router";
import { FilmStrip } from "@phosphor-icons/react";
import { Toaster } from "sonner";
import { SidebarLayout } from "@/shared/components/SidebarLayout";
import { useIsMobile } from "@/shared/components/ui/use-mobile";
import { Library } from "./components/Library";
import { PreviewPane } from "./components/PreviewPane";
import { RenderCommand } from "./components/RenderCommand";
import { ScriptPane } from "./components/ScriptPane";
import { StoryboardPane } from "./components/StoryboardPane";
import { VIEWS } from "./constants";
import { useMediaStatus } from "./hooks/useMediaStatus";
import { useVideoIndex } from "./hooks/useVideoIndex";
import { useVideoVariants } from "./hooks/useVideoVariants";
import type { VideoProject, VideoView } from "./types";

const EMPTY: VideoProject[] = [];

export default function App() {
  const index = useVideoIndex();
  const projects = index.status === "ready" ? index.projects : EMPTY;
  const media = useMediaStatus(projects);
  const variants = useVideoVariants();
  const [params, setParams] = useSearchParams();
  const [startAt, setStartAt] = useState<number | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const isMobile = useIsMobile();

  const view = (VIEWS.some((v) => v.id === params.get("view")) ? params.get("view") : "preview") as VideoView;
  const project = projects.find((p) => p.id === params.get("v")) ?? projects[0] ?? null;
  const variant = (project && variants[project.id]?.find((x) => x.id === params.get("variant"))) || null;
  // A person's version is the template served with their variables injected (dev server only).
  const playerSrc = project ? (variant ? `${project.path}?variant=${encodeURIComponent(variant.id)}` : project.path) : "";

  const update = (next: { v?: string; variant?: string | null; view?: VideoView }) => {
    const p = new URLSearchParams(params);
    if (next.v) p.set("v", next.v);
    if (next.variant) p.set("variant", next.variant);
    else if (next.variant === null) p.delete("variant");
    if (next.view) p.set("view", next.view);
    setParams(p, { replace: true });
  };

  const select = (id: string, variantId: string | null = null) => {
    setStartAt(null);
    update({ v: id, variant: variantId });
  };

  const openAt = (seconds: number) => {
    setStartAt(seconds);
    update({ view: "preview" });
  };

  const libraryProps = {
    projects,
    variants,
    selectedId: project?.id ?? null,
    selectedVariant: variant?.id ?? null,
    media,
  };

  const viewSwitch = (
    <div className="flex rounded-lg border border-border-subtle bg-surface p-0.5">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => update({ view: v.id })}
          className={`flex-1 px-3 py-1 rounded-md text-xs font-mono transition-colors ${
            view === v.id ? "bg-surface-2 text-brand-light" : "text-text-dim hover:text-text-primary"
          } ${isMobile ? "py-2" : ""}`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );

  // Phones are a viewer: the Library opens as a drawer, the view switch sits in
  // the bottom bar, and the render command (which needs a local checkout) is hidden.
  return (
    <>
      <Toaster position="top-center" richColors />
      <SidebarLayout
        sidebar={<Library {...libraryProps} onSelect={select} />}
        drawerTitle="Library"
        drawerContent={
          <Library
            {...libraryProps}
            inDrawer
            onSelect={(id, variantId) => {
              select(id, variantId);
              setLibraryOpen(false);
            }}
          />
        }
        drawerOpen={libraryOpen}
        onDrawerOpenChange={setLibraryOpen}
        editLabel="Library"
        editIcon={FilmStrip}
        barAction={project ? viewSwitch : undefined}
      >
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          {project && (
            <div className="flex items-center gap-4 px-4 md:px-6 py-3 border-b border-border-subtle shrink-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-sm text-text-primary font-semibold truncate">{variant ? variant.title : project.title}</h1>
                <p className="text-[11px] text-text-dim font-mono truncate">
                  {variant ? `${project.title} · ${variant.file}` : project.id}
                </p>
              </div>
              {!isMobile && (
                <>
                  {viewSwitch}
                  <RenderCommand id={project.id} variant={variant} />
                </>
              )}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto">
            {index.status === "loading" && <p className="p-4 md:p-8 text-sm text-text-dim">Loading videos…</p>}
            {index.status === "error" && (
              <p className="p-4 md:p-8 text-sm text-text-dim">
                Couldn't load the video index ({index.error}). Run{" "}
                <span className="font-mono text-text-primary">npm run video:index</span>.
              </p>
            )}
            {index.status === "ready" && !project && (
              <p className="p-4 md:p-8 text-sm text-text-dim">No video projects yet.</p>
            )}
            {project && view === "script" && <ScriptPane project={project} />}
            {project && view === "storyboard" && <StoryboardPane project={project} src={playerSrc} onOpen={openAt} />}
            {project && view === "preview" && (
              <PreviewPane project={project} src={playerSrc} media={media[project.id]} startAt={startAt} />
            )}
          </div>
        </div>
      </SidebarLayout>
    </>
  );
}
