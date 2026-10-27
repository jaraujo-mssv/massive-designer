import { useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FORMAT_LABEL, filterProjects, groupProjects, isFiltered, useCollapsed, useLibraryView } from "../library";
import type { ImageCategory, ImageProject } from "../types";
import { LibraryFilters } from "./LibraryFilters";
import { StatusBadge, Thumb } from "./ProjectThumb";

interface LibraryProps {
  projects: ImageProject[];
  categories: ImageCategory[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Phones: drawn inside the drawer, full width, without its own column frame. */
  inDrawer?: boolean;
}

/** The Library column beside the editor: the same search, filters and groups as the gallery page, in a sidebar. */
export function Library({ projects, categories, selectedId, onSelect, inDrawer = false }: LibraryProps) {
  const { view, set, reset } = useLibraryView();
  const [collapsed, toggleCollapsed] = useCollapsed();

  const visible = useMemo(() => filterProjects(projects, view, categories), [projects, categories, view]);
  const groups = useMemo(
    () => groupProjects(visible, view.group, view.sort, categories, projects),
    [visible, view.group, view.sort, categories, projects],
  );

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
        <LibraryFilters projects={projects} categories={categories} view={view} set={set} variant="sidebar" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 py-2">
        {visible.length === 0 && (
          <p className="px-5 py-6 text-sm text-text-dim">
            No images match{view.query ? ` “${view.query}”` : ""}
            {isFiltered(view) ? " with these filters" : ""}.{" "}
            <button className="text-brand-light hover:underline" onClick={reset}>
              Show all
            </button>
          </p>
        )}
        {groups.map((group) => {
          const collapseKey = `${view.group}:${group.key}`;
          // A search shows every match, whatever was collapsed.
          const open = !!view.query || !collapsed.has(collapseKey);
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
