import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import type { MediaStatus } from "../hooks/useMediaStatus";
import type { VideoProject } from "../types";
import { HfPlayer, HfPlayerHandle } from "./HfPlayer";

interface PreviewPaneProps {
  project: VideoProject;
  media: MediaStatus | undefined;
  /** Start playback here (set when opening from a storyboard frame). */
  startAt: number | null;
}

export function PreviewPane({ project, media, startAt }: PreviewPaneProps) {
  const player = useRef<HfPlayerHandle>(null);

  useEffect(() => {
    if (startAt !== null) player.current?.seek(startAt);
  }, [startAt]);

  const portrait = project.height > project.width;

  return (
    <div className="p-8 flex flex-col items-center gap-4">
      {media === "missing" && (
        <div className="w-full max-w-4xl flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-text-mid">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
          <div>
            Previewing without media. Voiceover, music and footage aren't deployed; they're available in a local
            checkout after <span className="font-mono text-text-primary">npm run video:media {project.id}</span>.
            <span className="block text-xs text-text-dim mt-1">Needs: {project.media.join(", ")}</span>
          </div>
        </div>
      )}
      <div className="w-full rounded-xl overflow-hidden border border-border-subtle bg-black" style={{ maxWidth: portrait ? 420 : 1100 }}>
        <HfPlayer
          ref={player}
          key={project.id}
          src={project.path}
          width={project.width}
          height={project.height}
          controls
          at={startAt ?? 0}
        />
      </div>
    </div>
  );
}
