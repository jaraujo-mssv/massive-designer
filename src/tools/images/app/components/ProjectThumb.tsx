import { Plus } from "lucide-react";
import { STATUS_LABEL } from "../library";
import type { ImageProject, ImageStatus } from "../types";

/** An image's thumbnail at its own aspect ratio; Planned entries are a dashed placeholder. */
export function Thumb({ p, className }: { p: ImageProject; className: string }) {
  if (p.status === "planned")
    return (
      <span
        className={`${className} rounded border border-dashed border-text-dim/50 flex items-center justify-center text-text-dim`}
        style={{ aspectRatio: `${p.width} / ${p.height}` }}
      >
        <Plus className="w-3.5 h-3.5" />
      </span>
    );
  return (
    <span className={`${className} rounded overflow-hidden bg-black border border-border-subtle`} style={{ aspectRatio: `${p.width} / ${p.height}` }}>
      {p.thumb && <img src={p.thumb} alt="" loading="lazy" className="w-full h-full object-cover" />}
    </span>
  );
}

export function StatusBadge({ status }: { status: ImageStatus }) {
  const tone =
    status === "ready"
      ? "text-emerald-400 border-emerald-400/40"
      : status === "posted"
        ? "text-sky-400 border-sky-400/40"
        : status === "planned"
          ? "text-text-dim border-text-dim/40 border-dashed"
          : "text-text-dim border-border-subtle";
  return <span className={`shrink-0 px-1.5 py-px rounded border text-[10px] font-mono uppercase tracking-wider ${tone}`}>{STATUS_LABEL[status]}</span>;
}
