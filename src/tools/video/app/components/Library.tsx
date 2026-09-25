import { Film, Lock } from "lucide-react";
import { BRAND_LABELS, KIND_LABELS } from "../constants";
import type { MediaStatus } from "../hooks/useMediaStatus";
import type { VideoProject } from "../types";

interface LibraryProps {
  projects: VideoProject[];
  selectedId: string | null;
  media: Record<string, MediaStatus>;
  onSelect: (id: string) => void;
}

interface Section {
  title: string;
  groups: { label: string; items: VideoProject[] }[];
}

function sections(projects: VideoProject[]): Section[] {
  const massive = projects.filter((p) => p.group === "massive");
  const templates = projects.filter((p) => p.group === "templates");
  const byKey = <K extends string>(items: VideoProject[], key: (p: VideoProject) => K, label: (k: K) => string) => {
    const map = new Map<K, VideoProject[]>();
    for (const p of items) map.set(key(p), [...(map.get(key(p)) ?? []), p]);
    return [...map.entries()].map(([k, list]) => ({ label: label(k), items: list }));
  };
  return [
    {
      title: "Massive",
      // New videos first, then ports.
      groups: byKey(massive, (p) => p.kind, (k) => KIND_LABELS[k] ?? k).sort(
        (a, b) => Number(a.label !== "New") - Number(b.label !== "New"),
      ),
    },
    {
      title: "Templates",
      groups: byKey(templates, (p) => p.brand ?? "other", (k) => BRAND_LABELS[k] ?? k),
    },
  ].filter((s) => s.groups.length > 0);
}

const fmtDuration = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : `${Math.round(s * 10) / 10}s`);

export function Library({ projects, selectedId, media, onSelect }: LibraryProps) {
  return (
    <div className="w-80 shrink-0 flex flex-col bg-surface border-r border-border-subtle">
      <div className="flex items-center px-4 py-3 border-b border-border-subtle shrink-0">
        <span className="text-xs font-semibold text-text-dim uppercase tracking-widest font-mono">Video</span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 py-2">
        {sections(projects).map((section) => (
          <div key={section.title} className="px-2 pb-3">
            <h3 className="px-2 pt-2 pb-1 text-xs font-semibold text-text-primary uppercase tracking-widest">
              {section.title}
            </h3>
            {section.groups.map((group) => (
              <div key={group.label} className="pb-1">
                <p className="px-2 pt-2 pb-1 text-[11px] text-text-dim font-mono uppercase tracking-wider">
                  {group.label}
                </p>
                {group.items.map((p) => {
                  const active = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelect(p.id)}
                      className={`w-full text-left px-2 py-2 rounded-lg flex items-start gap-2.5 transition-colors ${
                        active ? "bg-surface-2 border border-brand/30" : "border border-transparent hover:bg-surface-2"
                      }`}
                    >
                      <Film className={`w-4 h-4 mt-0.5 shrink-0 ${active ? "text-brand-light" : "text-text-dim"}`} />
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm text-text-primary truncate">{p.title}</span>
                          {media[p.id] === "missing" && (
                            <Lock className="w-3 h-3 text-text-dim shrink-0" aria-label="Media not synced" />
                          )}
                        </span>
                        <span className="block text-[11px] text-text-dim font-mono">
                          {p.width}×{p.height} · {p.fps}fps · {fmtDuration(p.duration)} · {p.status}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
