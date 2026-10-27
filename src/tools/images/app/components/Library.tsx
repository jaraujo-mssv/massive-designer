import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { ChevronDown, ChevronRight, LayoutGrid, List, Plus, Search, X } from "lucide-react";
import type { ImageCategory, ImageFormat, ImageProject, ImageStatus } from "../types";

interface LibraryProps {
  projects: ImageProject[];
  categories: ImageCategory[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Phones: drawn inside the drawer, full width, without its own column frame. */
  inDrawer?: boolean;
}

type GroupBy = "category" | "template" | "series" | "format" | "status" | "none";
type SortBy = "name" | "updated" | "status";
type View = "list" | "grid";
type Type = "all" | "images" | "templates";

const GROUP_BY: { id: GroupBy; label: string }[] = [
  { id: "category", label: "Category" },
  { id: "template", label: "Template" },
  { id: "series", label: "Series" },
  { id: "format", label: "Format" },
  { id: "status", label: "Status" },
  { id: "none", label: "None" },
];
const SORT_BY: { id: SortBy; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "updated", label: "Newest" },
  { id: "status", label: "Status" },
];
const TYPES: { id: Type; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "images", label: "Images" },
  { id: "templates", label: "Templates" },
];
const STATUS_ORDER: ImageStatus[] = ["ready", "draft", "planned", "posted"];
const STATUS_LABEL: Record<ImageStatus, string> = { ready: "Ready", draft: "Draft", planned: "Planned", posted: "Posted" };
const FORMAT_ORDER: ImageFormat[] = ["portrait", "square", "landscape", "story", "other"];
const FORMAT_LABEL: Record<ImageFormat, string> = {
  portrait: "Portrait 4:5",
  square: "Square",
  landscape: "Landscape 16:9",
  story: "Story 9:16",
  other: "Other",
};

/** URL keys for the Library's view, beside App's ?template=, so a filtered view can be linked. */
const PARAM = { group: "g", sort: "s", view: "v", category: "c", status: "st", format: "f", type: "t" } as const;
type ViewKey = keyof typeof PARAM;
const DEFAULTS: Record<ViewKey, string> = {
  group: "category",
  sort: "name",
  view: "list",
  category: "all",
  status: "all",
  format: "all",
  type: "all",
};

function useLibraryView() {
  const [params, setParams] = useSearchParams();
  const pick = <T extends string>(key: ViewKey, allowed: readonly string[]): T => {
    const v = params.get(PARAM[key]);
    return (v && allowed.includes(v) ? v : DEFAULTS[key]) as T;
  };
  const view = {
    group: pick<GroupBy>("group", GROUP_BY.map((g) => g.id)),
    sort: pick<SortBy>("sort", SORT_BY.map((s) => s.id)),
    view: pick<View>("view", ["list", "grid"]),
    category: params.get(PARAM.category) ?? "all",
    status: pick<ImageStatus | "all">("status", ["all", ...STATUS_ORDER]),
    format: pick<ImageFormat | "all">("format", ["all", ...FORMAT_ORDER]),
    type: pick<Type>("type", TYPES.map((t) => t.id)),
  };
  const set = (key: ViewKey, value: string) => {
    const next = new URLSearchParams(params);
    if (value === DEFAULTS[key]) next.delete(PARAM[key]);
    else next.set(PARAM[key], value);
    setParams(next, { replace: true });
  };
  const reset = () => {
    const next = new URLSearchParams(params);
    for (const key of Object.values(PARAM)) next.delete(key);
    setParams(next, { replace: true });
  };
  return { view, set, reset };
}

/** Collapsed group headers, remembered per browser. Storage can be missing or blocked; then nothing persists. */
const COLLAPSED_KEY = "images.library.collapsed";
function useCollapsed() {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? "[]") as string[]);
    } catch {
      return new Set();
    }
  });
  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
      } catch {
        // Private windows and blocked storage: the toggle still works for this visit.
      }
      return next;
    });
  return [collapsed, toggle] as const;
}

interface Group {
  key: string;
  label: string;
  /** Category groups nest their series; every other grouping has one unlabelled block. */
  blocks: { label: string | null; items: ImageProject[] }[];
  count: number;
}

const byTitle = (a: ImageProject, b: ImageProject) => a.title.localeCompare(b.title);
function sorter(sort: SortBy) {
  if (sort === "updated") return (a: ImageProject, b: ImageProject) => (b.updated ?? "").localeCompare(a.updated ?? "") || byTitle(a, b);
  if (sort === "status")
    return (a: ImageProject, b: ImageProject) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || byTitle(a, b);
  return byTitle;
}

/** The layout family an image belongs to: the template it's built on, or the template itself. */
const templateKey = (p: ImageProject) => p.template ?? (p.group === "templates" ? p.id : "");

function templateLabel(key: string, byId: Map<string, ImageProject>) {
  if (!key) return "One-offs";
  if (key === "new") return "New layouts (to design)";
  if (key.startsWith("video:")) return `Still of video: ${key.slice(6)}`;
  return byId.get(key)?.title ?? key;
}

function groupProjects(items: ImageProject[], groupBy: GroupBy, sort: SortBy, categories: ImageCategory[], all: ImageProject[]): Group[] {
  const cmp = sorter(sort);
  const byId = new Map(all.map((p) => [p.id, p]));
  const keyOf: Record<GroupBy, (p: ImageProject) => string> = {
    category: (p) => p.category ?? "",
    template: templateKey,
    series: (p) => p.series ?? "",
    format: (p) => p.format,
    status: (p) => p.status,
    none: () => "all",
  };
  const map = new Map<string, ImageProject[]>();
  for (const p of items) {
    const key = keyOf[groupBy](p);
    map.set(key, [...(map.get(key) ?? []), p]);
  }

  const catIndex = new Map(categories.map((c, i) => [c.id, i]));
  const rank = (key: string): [number, string] => {
    switch (groupBy) {
      case "category":
        return [key ? (catIndex.get(key) ?? categories.length) : categories.length + 1, key];
      case "template":
        return [!key ? 3 : key === "new" ? 2 : key.startsWith("video:") ? 1 : 0, templateLabel(key, byId)];
      case "series":
        return [key ? 0 : 1, key];
      case "format":
        return [FORMAT_ORDER.indexOf(key as ImageFormat), key];
      case "status":
        return [STATUS_ORDER.indexOf(key as ImageStatus), key];
      default:
        return [0, key];
    }
  };
  const label = (key: string) => {
    switch (groupBy) {
      case "category":
        return categories.find((c) => c.id === key)?.label ?? (key || "Uncategorized");
      case "template":
        return templateLabel(key, byId);
      case "series":
        return key || "No series";
      case "format":
        return FORMAT_LABEL[key as ImageFormat] ?? key;
      case "status":
        return STATUS_LABEL[key as ImageStatus] ?? key;
      default:
        return "All images";
    }
  };

  return [...map.entries()]
    .sort(([a], [b]) => {
      const [ra, la] = rank(a);
      const [rb, lb] = rank(b);
      return ra - rb || la.localeCompare(lb);
    })
    .map(([key, list]) => {
      let blocks: Group["blocks"];
      if (groupBy === "category") {
        // Loose images first, then each series under its name.
        const bySeries = new Map<string | null, ImageProject[]>();
        for (const p of list) bySeries.set(p.series, [...(bySeries.get(p.series) ?? []), p]);
        blocks = [...bySeries.entries()]
          .sort(([a], [b]) => (a === null ? -1 : b === null ? 1 : a.localeCompare(b)))
          .map(([series, ps]) => ({ label: series, items: ps.sort(cmp) }));
      } else if (groupBy === "template") {
        // The template heads its family.
        blocks = [{ label: null, items: list.sort((a, b) => Number(b.id === key) - Number(a.id === key) || cmp(a, b)) }];
      } else {
        blocks = [{ label: null, items: list.sort(cmp) }];
      }
      return { key, label: label(key), blocks, count: list.length };
    });
}

const haystack = (p: ImageProject, categories: ImageCategory[]) =>
  [
    p.title,
    p.id,
    p.series,
    p.status,
    p.group,
    p.description,
    p.template,
    p.format,
    categories.find((c) => c.id === p.category)?.label,
    ...p.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const selectClass =
  "min-w-0 w-full bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-[11px] font-mono text-text-primary outline-none focus:border-brand/50";
/** Group and Sort: a dim label inside the box, then a borderless select. */
const labelledClass =
  "flex-1 min-w-0 flex items-center gap-1 bg-surface-2 border border-border-subtle rounded-md pl-2 text-[11px] font-mono focus-within:border-brand/50";
const bareSelectClass = "min-w-0 w-full bg-transparent py-1 pr-1 text-[11px] font-mono text-text-primary outline-none";

function Thumb({ p, className }: { p: ImageProject; className: string }) {
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

function StatusBadge({ status }: { status: ImageStatus }) {
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

export function Library({ projects, categories, selectedId, onSelect, inDrawer = false }: LibraryProps) {
  const [query, setQuery] = useState("");
  const { view, set, reset } = useLibraryView();
  const [collapsed, toggleCollapsed] = useCollapsed();
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return projects.filter(
      (p) =>
        (view.category === "all" || (p.category ?? "") === view.category) &&
        (view.status === "all" || p.status === view.status) &&
        (view.format === "all" || p.format === view.format || p.formats?.includes(view.format)) &&
        (view.type === "all" || (view.type === "templates") === (p.group === "templates")) &&
        terms.every((t) => haystack(p, categories).includes(t)),
    );
  }, [projects, categories, view.category, view.status, view.format, view.type, query]);

  const groups = useMemo(
    () => groupProjects(visible, view.group, view.sort, categories, projects),
    [visible, view.group, view.sort, categories, projects],
  );

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const p of projects) c.set(p.category ?? "", (c.get(p.category ?? "") ?? 0) + 1);
    return c;
  }, [projects]);
  const filtered = view.category !== "all" || view.status !== "all" || view.format !== "all" || view.type !== "all";

  // "/" focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const item = (p: ImageProject) => {
    const active = p.id === selectedId;
    const frame = active ? "bg-surface-2 border border-brand/30" : "border border-transparent hover:bg-surface-2";
    if (view.view === "grid")
      return (
        <button key={p.id} onClick={() => onSelect(p.id)} className={`text-left p-1.5 rounded-lg flex flex-col gap-1.5 transition-colors ${frame}`}>
          <Thumb p={p} className="w-full" />
          <span className="text-xs text-text-primary leading-snug line-clamp-2">{p.title}</span>
          <span className="flex items-center gap-1.5 text-[10px] text-text-dim font-mono">
            {FORMAT_LABEL[p.format]}
            {p.status !== "draft" && <StatusBadge status={p.status} />}
          </span>
        </button>
      );
    return (
      <button key={p.id} onClick={() => onSelect(p.id)} className={`w-full text-left px-2 py-2 rounded-lg flex items-center gap-3 transition-colors ${frame}`}>
        <Thumb p={p} className="w-10 shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-sm text-text-primary truncate">{p.title}</span>
          <span className="block text-[11px] text-text-dim font-mono truncate">
            {p.formats ? p.formats.map((f) => FORMAT_LABEL[f]).join(" + ") : `${p.width}×${p.height}`}
          </span>
        </span>
        {p.status !== "draft" && <StatusBadge status={p.status} />}
      </button>
    );
  };

  return (
    <div className={inDrawer ? "flex flex-col" : "w-80 shrink-0 flex flex-col bg-surface border-r border-border-subtle"}>
      <div className="px-3 pt-3 pb-2 border-b border-border-subtle shrink-0 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-text-dim uppercase tracking-widest font-mono">Images</span>
          <span className="text-[11px] text-text-dim font-mono">
            {visible.length === projects.length ? projects.length : `${visible.length} of ${projects.length}`}
          </span>
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
            placeholder="Search images, tags, templates"
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

        <div className="flex items-center gap-1.5">
          <label className={labelledClass}>
            <span className="text-text-dim shrink-0">Group</span>
            <select aria-label="Group by" value={view.group} onChange={(e) => set("group", e.target.value)} className={bareSelectClass}>
              {GROUP_BY.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelledClass}>
            <span className="text-text-dim shrink-0">Sort</span>
            <select aria-label="Sort" value={view.sort} onChange={(e) => set("sort", e.target.value)} className={bareSelectClass}>
              {SORT_BY.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex shrink-0 rounded-md border border-border-subtle overflow-hidden">
            {(["list", "grid"] as const).map((v) => {
              const Icon = v === "list" ? List : LayoutGrid;
              return (
                <button
                  key={v}
                  onClick={() => set("view", v)}
                  aria-label={v === "list" ? "List view" : "Grid view"}
                  aria-pressed={view.view === v}
                  className={`p-1.5 ${view.view === v ? "bg-surface-2 text-brand-light" : "text-text-dim hover:text-text-primary"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <select aria-label="Category" value={view.category} onChange={(e) => set("category", e.target.value)} className={selectClass}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} ({counts.get(c.id) ?? 0})
              </option>
            ))}
            {counts.has("") && <option value="">Uncategorized ({counts.get("")})</option>}
          </select>
          <select aria-label="Status" value={view.status} onChange={(e) => set("status", e.target.value)} className={selectClass}>
            <option value="all">All statuses</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <select aria-label="Format" value={view.format} onChange={(e) => set("format", e.target.value)} className={selectClass}>
            <option value="all">All formats</option>
            {FORMAT_ORDER.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABEL[f]}
              </option>
            ))}
          </select>
          <select aria-label="Type" value={view.type} onChange={(e) => set("type", e.target.value)} className={selectClass}>
            {TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 py-2">
        {visible.length === 0 && (
          <p className="px-5 py-6 text-sm text-text-dim">
            No images match{query ? ` “${query}”` : ""}
            {filtered ? " with these filters" : ""}.{" "}
            <button
              className="text-brand-light hover:underline"
              onClick={() => {
                setQuery("");
                reset();
              }}
            >
              Show all
            </button>
          </p>
        )}
        {groups.map((group) => {
          const collapseKey = `${view.group}:${group.key}`;
          // A search shows every match, whatever was collapsed.
          const open = !!query || !collapsed.has(collapseKey);
          return (
            <div key={group.key || "-"} className="px-2 pb-2">
              {view.group !== "none" && (
                <button
                  onClick={() => toggleCollapsed(collapseKey)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-1.5 px-1 pt-2 pb-1 text-left text-xs font-semibold text-text-primary uppercase tracking-widest hover:text-brand-light"
                >
                  {open ? <ChevronDown className="w-3.5 h-3.5 text-text-dim" /> : <ChevronRight className="w-3.5 h-3.5 text-text-dim" />}
                  <span className="flex-1 truncate">{group.label}</span>
                  <span className="text-[11px] font-mono font-normal text-text-dim">{group.count}</span>
                </button>
              )}
              {open &&
                group.blocks.map((block) => (
                  <div key={block.label ?? "-"} className="pb-1">
                    {block.label && <p className="px-2 pt-2 pb-1 text-[11px] text-text-dim font-mono uppercase tracking-wider">{block.label}</p>}
                    <div className={view.view === "grid" ? "grid grid-cols-2 gap-1" : ""}>{block.items.map(item)}</div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
