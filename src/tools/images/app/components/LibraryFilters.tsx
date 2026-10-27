import { useEffect, useMemo, useRef } from "react";
import { LayoutGrid, List, Search, X } from "lucide-react";
import { FORMAT_LABEL, FORMAT_ORDER, GROUP_BY, SORT_BY, STATUS_LABEL, STATUS_ORDER, TYPES, type LibraryView, type ViewKey } from "../library";
import type { ImageCategory, ImageProject } from "../types";

interface LibraryFiltersProps {
  projects: ImageProject[];
  categories: ImageCategory[];
  view: LibraryView;
  set: (key: ViewKey, value: string) => void;
  /** "sidebar": stacked in the Library column; "bar": one row across the top of the gallery, wrapping on phones. */
  variant: "sidebar" | "bar";
}

const SIZES = {
  sidebar: {
    select: "min-w-0 w-full bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-[11px] font-mono text-text-primary outline-none focus:border-brand/50",
    labelled: "flex-1 min-w-0 flex items-center gap-1 bg-surface-2 border border-border-subtle rounded-md pl-2 text-[11px] font-mono focus-within:border-brand/50",
    bare: "min-w-0 w-full bg-transparent py-1 pr-1 text-[11px] font-mono text-text-primary outline-none",
    search: "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-2 focus-within:border-brand/50",
    toggle: "p-1.5",
    icon: "w-3.5 h-3.5",
  },
  bar: {
    select: "min-w-0 h-9 bg-surface-2 border border-border-subtle rounded-lg px-2.5 text-xs font-mono text-text-primary outline-none focus:border-brand/50",
    labelled: "flex-1 sm:flex-none min-w-0 h-9 flex items-center gap-1.5 bg-surface-2 border border-border-subtle rounded-lg pl-2.5 text-xs font-mono focus-within:border-brand/50",
    bare: "min-w-0 bg-transparent pr-1.5 text-xs font-mono text-text-primary outline-none",
    search: "h-9 flex items-center gap-2 px-3 rounded-lg border border-border-subtle bg-surface-2 focus-within:border-brand/50",
    toggle: "px-2.5 h-full",
    icon: "w-4 h-4",
  },
};

/** The Library's search and filters: Group, Sort, list or grid, and Category, Status, Format and Type. */
export function LibraryFilters({ projects, categories, view, set, variant }: LibraryFiltersProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const size = SIZES[variant];
  const bar = variant === "bar";

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const p of projects) c.set(p.category ?? "", (c.get(p.category ?? "") ?? 0) + 1);
    return c;
  }, [projects]);

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

  const search = (
    <label className={`${size.search} ${bar ? "flex-1 min-w-0" : ""}`}>
      <Search className={`${size.icon} text-text-dim shrink-0`} />
      <input
        ref={searchRef}
        value={view.query}
        onChange={(e) => set("query", e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            set("query", "");
            e.currentTarget.blur();
          }
        }}
        placeholder="Search images, tags, templates"
        className="flex-1 min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-dim outline-none"
      />
      {view.query ? (
        <button onClick={() => set("query", "")} aria-label="Clear search" className="text-text-dim hover:text-text-primary">
          <X className={size.icon} />
        </button>
      ) : (
        <kbd className="text-[10px] font-mono text-text-dim border border-border-subtle rounded px-1">/</kbd>
      )}
    </label>
  );

  const groupSort = (
    <>
      <label className={size.labelled}>
        <span className="text-text-dim shrink-0">Group</span>
        <select aria-label="Group by" value={view.group} onChange={(e) => set("group", e.target.value)} className={size.bare}>
          {GROUP_BY.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </label>
      <label className={size.labelled}>
        <span className="text-text-dim shrink-0">Sort</span>
        <select aria-label="Sort" value={view.sort} onChange={(e) => set("sort", e.target.value)} className={size.bare}>
          {SORT_BY.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );

  const toggle = (
    <div className={`flex shrink-0 rounded-md border border-border-subtle overflow-hidden ${bar ? "h-9 rounded-lg" : ""}`}>
      {(["grid", "list"] as const).map((v) => {
        const Icon = v === "list" ? List : LayoutGrid;
        return (
          <button
            key={v}
            onClick={() => set("view", v)}
            aria-label={v === "list" ? "List view" : "Grid view"}
            aria-pressed={view.view === v}
            className={`${size.toggle} ${view.view === v ? "bg-surface-2 text-brand-light" : "text-text-dim hover:text-text-primary"}`}
          >
            <Icon className={size.icon} />
          </button>
        );
      })}
    </div>
  );

  const filters = (
    <>
      <select aria-label="Category" value={view.category} onChange={(e) => set("category", e.target.value)} className={size.select}>
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label} ({counts.get(c.id) ?? 0})
          </option>
        ))}
        {counts.has("") && <option value="">Uncategorized ({counts.get("")})</option>}
      </select>
      <select aria-label="Status" value={view.status} onChange={(e) => set("status", e.target.value)} className={size.select}>
        <option value="all">All statuses</option>
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <select aria-label="Format" value={view.format} onChange={(e) => set("format", e.target.value)} className={size.select}>
        <option value="all">All formats</option>
        {FORMAT_ORDER.map((f) => (
          <option key={f} value={f}>
            {FORMAT_LABEL[f]}
          </option>
        ))}
      </select>
      <select aria-label="Type" value={view.type} onChange={(e) => set("type", e.target.value)} className={size.select}>
        {TYPES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </>
  );

  // On phones the list/grid toggle sits beside the search, so Group and Sort have room for their names.
  if (bar)
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-1 lg:min-w-[240px]">
          {search}
          <div className="sm:hidden">{toggle}</div>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">{filters}</div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {groupSort}
          <div className="hidden sm:block">{toggle}</div>
        </div>
      </div>
    );

  return (
    <>
      {search}
      <div className="flex items-center gap-1.5">
        {groupSort}
        {toggle}
      </div>
      <div className="grid grid-cols-2 gap-1.5">{filters}</div>
    </>
  );
}
