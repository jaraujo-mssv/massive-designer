import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { ImageProject } from "../types";

interface LibraryProps {
  projects: ImageProject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Phones: drawn inside the drawer, full width, without its own column frame. */
  inDrawer?: boolean;
}

type Filter = "all" | "massive" | "templates";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "massive", label: "Massive" },
  { id: "templates", label: "Templates" },
];

interface Section {
  title: string;
  groups: { label: string | null; projects: ImageProject[] }[];
}

/** Massive images, then templates; within each, projects of a series sit together under its name. */
function sections(projects: ImageProject[]): Section[] {
  return (
    [
      { title: "Massive", group: "massive" },
      { title: "Templates", group: "templates" },
    ] as const
  )
    .map(({ title, group }) => {
      const map = new Map<string | null, ImageProject[]>();
      for (const p of projects.filter((x) => x.group === group)) map.set(p.series, [...(map.get(p.series) ?? []), p]);
      // Loose images first, then series by name.
      const groups = [...map.entries()]
        .sort(([a], [b]) => (a === null ? -1 : b === null ? 1 : a.localeCompare(b)))
        .map(([label, list]) => ({ label, projects: list }));
      return { title, groups };
    })
    .filter((s) => s.groups.length > 0);
}

const haystack = (p: ImageProject) =>
  [p.title, p.id, p.series, p.status, p.group, p.description, ...p.tags].filter(Boolean).join(" ").toLowerCase();

export function Library({ projects, selectedId, onSelect, inDrawer = false }: LibraryProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return projects.filter(
      (p) => (filter === "all" || p.group === filter) && terms.every((t) => haystack(p).includes(t)),
    );
  }, [projects, filter, query]);

  // "/" focuses search.
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

  return (
    <div className={inDrawer ? "flex flex-col" : "w-80 shrink-0 flex flex-col bg-surface border-r border-border-subtle"}>
      <div className="px-3 pt-3 pb-2 border-b border-border-subtle shrink-0 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-text-dim uppercase tracking-widest font-mono">Images</span>
          <span className="text-[11px] text-text-dim font-mono">{visible.length}</span>
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
            placeholder="Search images and tags"
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
          {FILTERS.map((f) => (
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
        {visible.length === 0 && (
          <p className="px-5 py-6 text-sm text-text-dim">
            No images match{query ? ` “${query}”` : ""}.{" "}
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
        {sections(visible).map((section) => (
          <div key={section.title} className="px-2 pb-3">
            <h3 className="px-2 pt-2 pb-1 text-xs font-semibold text-text-primary uppercase tracking-widest">{section.title}</h3>
            {section.groups.map((group) => (
              <div key={group.label ?? "-"} className="pb-1">
                {group.label && (
                  <p className="px-2 pt-2 pb-1 text-[11px] text-text-dim font-mono uppercase tracking-wider">{group.label}</p>
                )}
                {group.projects.map((p) => {
                  const active = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelect(p.id)}
                      className={`w-full text-left px-2 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                        active ? "bg-surface-2 border border-brand/30" : "border border-transparent hover:bg-surface-2"
                      }`}
                    >
                      <span
                        className="w-10 shrink-0 rounded overflow-hidden bg-black border border-border-subtle"
                        style={{ aspectRatio: `${p.width} / ${p.height}` }}
                      >
                        {p.thumb && <img src={p.thumb} alt="" loading="lazy" className="w-full h-full object-cover" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-text-primary truncate">{p.title}</span>
                        <span className="block text-[11px] text-text-dim font-mono">
                          {p.width}×{p.height} · {p.status}
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
