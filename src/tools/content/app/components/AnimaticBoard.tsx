import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CaretLeft, CaretRight, CircleNotch, DownloadSimple, Play, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useIsMobile } from "@/shared/components/ui/use-mobile";
import { FORMATS } from "../constants";
import type { BriefDoc, ScriptDoc, Shot } from "../types";
import { exportFrame } from "../utils/export";
import { fmtSeconds, totalSeconds } from "../utils/shots";
import { FrameBox } from "./FrameBox";
import { EndCardFrame, ShotFrame } from "./frames";

/** A shot's frame: the end card for the closing shot, a storyboard frame otherwise. */
function Frame({ doc, brief, shot }: { doc: ScriptDoc; brief: BriefDoc | null; shot: Shot }) {
  if (shot.endCard) {
    return (
      <EndCardFrame
        format={doc.format}
        endCard={doc.endCard}
        tagline={brief?.tagline ?? null}
        signoff={brief?.signoff ?? null}
        url={brief?.url ?? null}
        onCamera={shot.lines.filter((l) => l.speaker !== "VO")}
      />
    );
  }
  return <ShotFrame shot={shot} format={doc.format} label={doc.title} />;
}

const fileName = (doc: ScriptDoc, shot: Shot) => `${doc.id}-shot-${String(shot.n).padStart(2, "0")}.png`;

export function AnimaticBoard({ doc, brief }: { doc: ScriptDoc; brief: BriefDoc | null }) {
  const isMobile = useIsMobile();
  const { w, h, label } = FORMATS[doc.format];
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [viewing, setViewing] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | "all" | null>(null);
  // Preview width: a 9:16 frame is narrow, so it can be smaller and still read.
  const previewWidth = doc.format === "vertical" ? (isMobile ? 156 : 216) : isMobile ? 320 : 400;
  const scale = previewWidth / w;

  const exportOne = async (i: number) => {
    setBusy(i);
    try {
      await exportFrame(refs.current[i], w, h, fileName(doc, doc.shots[i]));
    } catch (err) {
      toast.error(`Export failed: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const exportAll = async () => {
    setBusy("all");
    try {
      for (let i = 0; i < doc.shots.length; i++) await exportFrame(refs.current[i], w, h, fileName(doc, doc.shots[i]));
    } catch (err) {
      toast.error(`Export failed: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  if (!doc.shots.length) return <p className="text-sm text-text-dim">No shots to draw yet. Add a ## Shots table.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-text-dim">
          {doc.shots.length} frames · {label} · {w}×{h} · ~{fmtSeconds(totalSeconds(doc.shots))}
        </span>
        <span className="flex-1" />
        <button
          onClick={() => setViewing(0)}
          className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-brand hover:text-brand-light"
        >
          <Play size={12} weight="fill" /> Full screen
        </button>
        {!isMobile && (
          <button
            onClick={exportAll}
            disabled={busy !== null}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy === "all" ? <CircleNotch size={12} className="animate-spin" /> : <DownloadSimple size={12} weight="bold" />}
            Export all PNGs
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 md:gap-5">
        {doc.shots.map((shot, i) => (
          <figure key={shot.n} className="flex flex-col gap-2" style={{ width: Math.floor(previewWidth) }}>
            <button
              onClick={() => setViewing(i)}
              title="Open in the viewer"
              className="overflow-hidden rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-border-subtle transition hover:ring-brand/60"
            >
              <FrameBox ref={(el) => (refs.current[i] = el)} w={w} h={h} scale={scale}>
                <Frame doc={doc} brief={brief} shot={shot} />
              </FrameBox>
            </button>
            <figcaption className="flex items-center gap-2 font-mono text-[11px] text-text-dim">
              <span className="text-text-mid">{shot.endCard ? "End card" : `Shot ${shot.n}`}</span>
              <span>{shot.duration === null ? "~" : ""}{Math.round(shot.seconds)}s</span>
              <span className="flex-1" />
              <button
                onClick={() => exportOne(i)}
                disabled={busy !== null}
                title="Export PNG"
                aria-label={`Export shot ${shot.n} as PNG`}
                className="rounded p-1 hover:bg-surface-2 hover:text-text-primary disabled:opacity-50"
              >
                {busy === i ? <CircleNotch size={13} className="animate-spin" /> : <DownloadSimple size={13} />}
              </button>
            </figcaption>
          </figure>
        ))}
      </div>

      {viewing !== null && <Viewer doc={doc} brief={brief} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

/** Full screen, one frame at a time: ←/→ to step, Esc to close. */
function Viewer({
  doc,
  brief,
  index,
  onIndex,
  onClose,
}: {
  doc: ScriptDoc;
  brief: BriefDoc | null;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const { w, h } = FORMATS[doc.format];
  const [viewport, setViewport] = useState({ vw: window.innerWidth, vh: window.innerHeight });
  const last = doc.shots.length - 1;
  const shot = doc.shots[index];

  useEffect(() => {
    const onResize = () => setViewport({ vw: window.innerWidth, vh: window.innerHeight });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        onIndex(Math.min(last, index + 1));
      } else if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [index, last, onClose, onIndex]);

  // Leave room for the bar under the frame.
  const scale = Math.min((viewport.vw - 32) / w, (viewport.vh - 120) / h);

  return createPortal(
    <div role="dialog" aria-modal aria-label={`${doc.title}, animatic`} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/95 p-4">
      <FrameBox w={w} h={h} scale={scale} className="rounded-lg">
        <Frame doc={doc} brief={brief} shot={shot} />
      </FrameBox>
      <div className="flex items-center gap-3 font-mono text-xs text-text-dim">
        <button onClick={() => onIndex(Math.max(0, index - 1))} disabled={index === 0} aria-label="Previous shot" className="rounded-lg p-2 hover:bg-surface-2 hover:text-text-primary disabled:opacity-30">
          <CaretLeft size={16} weight="bold" />
        </button>
        <span className="min-w-24 text-center">
          {index + 1} / {last + 1}
        </span>
        <button onClick={() => onIndex(Math.min(last, index + 1))} disabled={index === last} aria-label="Next shot" className="rounded-lg p-2 hover:bg-surface-2 hover:text-text-primary disabled:opacity-30">
          <CaretRight size={16} weight="bold" />
        </button>
        <button onClick={onClose} aria-label="Close viewer" className="ml-4 rounded-lg p-2 hover:bg-surface-2 hover:text-text-primary">
          <X size={16} weight="bold" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
