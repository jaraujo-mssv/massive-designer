import { useState } from "react";
import { useSearchParams } from "react-router";
import { Toaster } from "sonner";
import { Library } from "./components/Library";
import { PreviewPane } from "./components/PreviewPane";
import { RenderCommand } from "./components/RenderCommand";
import { ScriptPane } from "./components/ScriptPane";
import { StoryboardPane } from "./components/StoryboardPane";
import { VIEWS } from "./constants";
import { useMediaStatus } from "./hooks/useMediaStatus";
import { useVideoIndex } from "./hooks/useVideoIndex";
import type { VideoProject, VideoView } from "./types";

const EMPTY: VideoProject[] = [];

export default function App() {
  const index = useVideoIndex();
  const projects = index.status === "ready" ? index.projects : EMPTY;
  const media = useMediaStatus(projects);
  const [params, setParams] = useSearchParams();
  const [startAt, setStartAt] = useState<number | null>(null);

  const view = (VIEWS.some((v) => v.id === params.get("view")) ? params.get("view") : "preview") as VideoView;
  const project = projects.find((p) => p.id === params.get("v")) ?? projects[0] ?? null;

  const update = (next: { v?: string; view?: VideoView }) => {
    const p = new URLSearchParams(params);
    if (next.v) p.set("v", next.v);
    if (next.view) p.set("view", next.view);
    setParams(p, { replace: true });
  };

  const select = (id: string) => {
    setStartAt(null);
    update({ v: id });
  };

  const openAt = (seconds: number) => {
    setStartAt(seconds);
    update({ view: "preview" });
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex h-full overflow-hidden bg-bg">
        <Library projects={projects} selectedId={project?.id ?? null} media={media} onSelect={select} />

        <div className="flex-1 min-w-0 flex flex-col">
          {project && (
            <div className="flex items-center gap-4 px-6 py-3 border-b border-border-subtle shrink-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-sm text-text-primary font-semibold truncate">{project.title}</h1>
                <p className="text-[11px] text-text-dim font-mono truncate">{project.id}</p>
              </div>
              <div className="flex rounded-lg border border-border-subtle bg-surface p-0.5">
                {VIEWS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => update({ view: v.id })}
                    className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                      view === v.id ? "bg-surface-2 text-brand-light" : "text-text-dim hover:text-text-primary"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <RenderCommand id={project.id} />
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto">
            {index.status === "loading" && <p className="p-8 text-sm text-text-dim">Loading videos…</p>}
            {index.status === "error" && (
              <p className="p-8 text-sm text-text-dim">
                Couldn't load the video index ({index.error}). Run{" "}
                <span className="font-mono text-text-primary">npm run video:index</span>.
              </p>
            )}
            {index.status === "ready" && !project && (
              <p className="p-8 text-sm text-text-dim">No video projects yet.</p>
            )}
            {project && view === "script" && <ScriptPane project={project} />}
            {project && view === "storyboard" && <StoryboardPane project={project} onOpen={openAt} />}
            {project && view === "preview" && (
              <PreviewPane project={project} media={media[project.id]} startAt={startAt} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
