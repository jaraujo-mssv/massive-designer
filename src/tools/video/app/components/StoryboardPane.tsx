import { useRef } from "react";
import { Mic, Play } from "lucide-react";
import { useOnScreen } from "../hooks/useOnScreen";
import type { StoryboardFrame, VideoProject } from "../types";
import { HfPlayer } from "./HfPlayer";

const STATUS_STYLES: Record<StoryboardFrame["status"], string> = {
  outline: "text-text-dim border-border-subtle",
  built: "text-sky-300 border-sky-400/30",
  animated: "text-brand-light border-brand/30",
};

function posterTime(frame: StoryboardFrame, total: number): number {
  const offset = frame.poster ?? (frame.duration ? frame.duration / 2 : 0);
  // Stay inside the video so the last frame's poster isn't past the end.
  return Math.min(frame.start + offset, Math.max(0, total - 0.05));
}

function FrameTile({
  project,
  frame,
  onOpen,
}: {
  project: VideoProject;
  frame: StoryboardFrame;
  onOpen: (seconds: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(ref);
  const at = posterTime(frame, project.duration);
  const thumbWidth = project.width > project.height ? 480 : project.width < project.height ? 240 : 320;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden flex flex-col md:flex-row">
      <div
        ref={ref}
        className="relative bg-black w-full md:w-[var(--thumb-w)] shrink-0 self-start"
        style={{
          aspectRatio: `${project.width} / ${project.height}`,
          ["--thumb-w" as string]: `${thumbWidth}px`,
        }}
      >
        {frame.status === "outline" ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-text-dim font-mono">
            outline
          </div>
        ) : (
          visible && (
            <div className="absolute inset-0 pointer-events-none">
              <HfPlayer src={project.path} width={project.width} height={project.height} muted at={at} />
            </div>
          )
        )}
        <button
          onClick={() => onOpen(frame.start)}
          className="absolute inset-0 hover:bg-white/5 transition-colors"
          aria-label={`Preview from frame ${frame.index}`}
        />
      </div>
      <div className="p-5 space-y-2 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-dim">{String(frame.index).padStart(2, "0")}</span>
          <h3 className="text-sm text-text-primary font-semibold flex-1 truncate">{frame.title}</h3>
          <span className={`text-[10px] font-mono uppercase border rounded px-1.5 py-0.5 ${STATUS_STYLES[frame.status]}`}>
            {frame.status}
          </span>
        </div>
        <p className="text-[11px] font-mono text-text-dim">
          {frame.start.toFixed(1)}s{frame.duration ? ` · ${frame.duration}s` : ""}
          {frame.transitionIn ? ` · ${frame.transitionIn}` : ""}
        </p>
        {frame.scene && <p className="text-sm text-text-mid">{frame.scene}</p>}
        {frame.voiceover && (
          <p className="text-sm text-text-primary flex gap-2">
            <Mic className="w-3.5 h-3.5 mt-1 shrink-0 text-brand-light" />
            <span>“{frame.voiceover}”</span>
          </p>
        )}
        {frame.narrative && <p className="text-xs text-text-dim leading-relaxed">{frame.narrative}</p>}
      </div>
    </div>
  );
}

export function StoryboardPane({ project, onOpen }: { project: VideoProject; onOpen: (seconds: number) => void }) {
  const board = project.storyboard;
  if (!board) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-sm text-text-dim">
        No STORYBOARD.md yet. Plan the frames with Claude Code (<span className="font-mono">/massive-video</span>).
      </div>
    );
  }

  const { globals } = board;
  const facts = [
    ["Message", globals.message],
    ["Arc", globals.arc],
    ["Audience", globals.audience],
    ["Format", globals.format],
  ].filter((f): f is [string, string] => !!f[1]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start gap-6 max-w-6xl">
        {facts.length > 0 && (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm max-w-3xl flex-1">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-text-dim">{k}</dt>
                <dd className="text-text-mid">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <button
          onClick={() => onOpen(0)}
          className="ml-auto shrink-0 flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-mono text-brand-light hover:bg-brand/20 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          Preview full video
        </button>
      </div>
      <div className="flex flex-col gap-4 max-w-6xl">
        {board.frames.map((f) => (
          <FrameTile key={f.index} project={project} frame={f} onOpen={onOpen} />
        ))}
      </div>
      {board.warnings.length > 0 && (
        <ul className="text-xs text-text-dim list-disc pl-4">
          {board.warnings.map((w, i) => (
            <li key={i}>{w.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
