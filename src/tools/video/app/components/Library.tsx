import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Film, Lock, Search, User, X } from "lucide-react";
import { BRAND_LABELS, KIND_LABELS } from "../constants";
import type { MediaStatus } from "../hooks/useMediaStatus";
import type { VideoProject, VideoVariant } from "../types";

interface LibraryProps {
  projects: VideoProject[];
  variants: Record<string, VideoVariant[]>;
  selectedId: string | null;
  selectedVariant: string | null;
  media: Record<string, MediaStatus>;
  onSelect: (id: string, variant?: string | null) => void;
  /** Phones: drawn inside the drawer, full width, without its own column frame. */
  inDrawer?: boolean;
}

type Filter = "all" | "massive" | "templates" | "team";

/** A project and the variants to list under it after search and filtering. */
interface Entry {
  project: VideoProject;
  variants: VideoVariant[];
}

interface Section {
  title: string;
  groups: { label: string; entries: Entry[] }[];
}

function sections(entries: Entry[]): Section[] {
  const byKey = (items: Entry[], key: (p: VideoProject) => string, label: (k: string) => string) => {
    const map = new Map<string, Entry[]>();
    for (const e of items) map.set(key(e.project), [...(map.get(key(e.project)) ?? []), e]);
    return [...map.entries()].map(([k, list]) => ({ label: label(k), entries: list }));
  };
  return [
    {
      title: "Massive",
      // New videos first, then ports.
      groups: byKey(
        entries.filter((e) => e.project.group === "massive"),
        (p) => p.kind,
        (k) => KIND_LABELS[k] ?? k,
      ).sort((a, b) => Number(a.label !== "New") - Number(b.label !== "New")),
    },
    {
      title: "Templates",
      groups: byKey(
        entries.filter((e) => e.project.group === "templates"),
        (p) => p.brand ?? "other",
        (k) => BRAND_LABELS[k] ?? k,
      ),
    },
  ].filter((s) => s.groups.length > 0);
}

const haystack = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" ").toLowerCase();

const projectText = (p: VideoProject) =>
  haystack(p.title, p.id, p.status, p.brand && BRAND_LABELS[p.brand], KIND_LABELS[p.kind], p.group);

const variantText = (v: VideoVariant) =>
  haystack(v.title, v.subtitle, v.id, ...Object.values(v.variables).map((x) => (typeof x === "string" ? x : null)));

function filterEntries(
  projects: VideoProject[],
  variants: Record<string, VideoVariant[]>,
  filter: Filter,
  query: string,
): Entry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (text: string) => terms.every((t) => text.includes(t));
  return projects.flatMap((project) => {
    const all = variants[project.id] ?? [];
    if (filter === "massive" && project.group !== "massive") return [];
    if (filter === "templates" && project.group !== "templates") return [];
    if (filter === "team" && all.length === 0) return [];
    if (!terms.length) return [{ project, variants: all }];
    // A project match keeps all its variants; otherwise list only the variants that match.
    if (matches(projectText(project))) return [{ project, variants: all }];
    const hits = all.filter((v) => matches(variantText(v)));
    return hits.length ? [{ project, variants: hits }] : [];
  });
}

const fmtDuration = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : `${Math.round(s * 10) / 10}s`);

export function Library({ projects, variants, selectedId, selectedVariant, media, onSelect, inDrawer = false }: LibraryProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const hasVariants = Object.values(variants).some((list) => list.length > 0);
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "massive", label: "Massive" },
    { id: "templates", label: "Templates" },
    ...(hasVariants ? [{ id: "team" as const, label: "Team" }] : []),
  ];

  const entries = useMemo(() => filterEntries(projects, variants, filter, query), [projects, variants, filter, query]);
  const total = entries.length + entries.reduce((n, e) => n + e.variants.length, 0);

  // Open the list that holds the selected variant (e.g. from a shared URL).
  useEffect(() => {
    if (selectedId && selectedVariant) setExpanded((s) => (s.has(selectedId) ? s : new Set(s).add(selectedId)));
  }, [selectedId, selectedVariant]);

  // "/" focuses search, Escape clears it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Searching or the Team filter shows every matching variant without clicking open.
  const isOpen = (id: string) => expanded.has(id) || !!query.trim() || filter === "team";

  return (
    <div className={inDrawer ? "flex flex-col" : "w-80 shrink-0 flex flex-col bg-surface border-r border-border-subtle"}>
      <div className="px-3 pt-3 pb-2 border-b border-border-subtle shrink-0 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-text-dim uppercase tracking-widest font-mono">Video</span>
          <span className="text-[11px] text-text-dim font-mono">{total}</span>
        </div>
        <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-2 focus-within:border-brand/50">
          <Search className="w-3.5 h-3.5 text-text-dim shrink-0" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQuery("");
                e.currentTarget.blur();
              }
            }}
            placeholder="Search videos and people"
            className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-dim outline-none"
          />
          {query ? (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="text-text-dim hover:text-text-primary">
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="text-[10px] font-mono text-text-dim border border-border-subtle rounded px-1">/</kbd>
          )}
        </label>
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                filter === f.id ? "bg-surface-2 text-brand-light" : "text-text-dim hover:text-text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 py-2">
        {entries.length === 0 && (
          <p className="px-5 py-6 text-sm text-text-dim">
            No videos match{query ? ` “${query}”` : ""}.{" "}
            <button
              className="text-brand-light hover:underline"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Show all
            </button>
          </p>
        )}
        {sections(entries).map((section) => (
          <div key={section.title} className="px-2 pb-3">
            <h3 className="px-2 pt-2 pb-1 text-xs font-semibold text-text-primary uppercase tracking-widest">
              {section.title}
            </h3>
            {section.groups.map((group) => (
              <div key={group.label} className="pb-1">
                <p className="px-2 pt-2 pb-1 text-[11px] text-text-dim font-mono uppercase tracking-wider">
                  {group.label}
                </p>
                {group.entries.map(({ project: p, variants: list }) => {
                  const active = p.id === selectedId && !selectedVariant;
                  const allCount = variants[p.id]?.length ?? 0;
                  const open = isOpen(p.id);
                  return (
                    <div key={p.id}>
                      <div className="flex items-start">
                        <button
                          onClick={() => onSelect(p.id, null)}
                          className={`flex-1 min-w-0 text-left px-2 py-2 rounded-lg flex items-start gap-2.5 transition-colors ${
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
                        {allCount > 0 && (
                          <button
                            onClick={() => toggle(p.id)}
                            aria-expanded={open}
                            title={open ? "Hide people" : "Show people"}
                            className="mt-1.5 ml-0.5 shrink-0 flex items-center gap-0.5 px-1 py-1 rounded-md text-[11px] font-mono text-text-dim hover:text-text-primary hover:bg-surface-2"
                          >
                            {list.length < allCount ? `${list.length}/${allCount}` : allCount}
                            <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} />
                          </button>
                        )}
                      </div>
                      {open && list.length > 0 && (
                        <div className="ml-4 pl-2 border-l border-border-subtle">
                          {list.map((v) => {
                            const vActive = p.id === selectedId && v.id === selectedVariant;
                            return (
                              <button
                                key={v.id}
                                onClick={() => onSelect(p.id, v.id)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-start gap-2 transition-colors ${
                                  vActive ? "bg-surface-2 border border-brand/30" : "border border-transparent hover:bg-surface-2"
                                }`}
                              >
                                <User className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${vActive ? "text-brand-light" : "text-text-dim"}`} />
                                <span className="flex-1 min-w-0">
                                  <span className="block text-sm text-text-primary truncate">{v.title}</span>
                                  {v.subtitle && <span className="block text-[11px] text-text-dim truncate">{v.subtitle}</span>}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
