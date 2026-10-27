import { useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FORMAT_LABEL, filterProjects, groupProjects, inPool, isFiltered, useCollapsed, useLibraryView } from "../library";
import type { ImageCategory, ImageProject } from "../types";
import { LibraryFilters } from "./LibraryFilters";
import { StatusBadge, Thumb } from "./ProjectThumb";

interface GalleryProps {
  projects: ImageProject[];
  categories: ImageCategory[];
  onOpen: (id: string) => void;
  /** Beside the page title (Use with AI). */
  action?: React.ReactNode;
}

const badgeClass = "px-1.5 py-px rounded border text-[10px] font-mono uppercase tracking-wider";

/**
 * The Images home page (/images with no image picked): every image as a thumbnail, with the Library's search and
 * filters across the top. The view lives in the URL, shared with the editor's Library sidebar.
 */
export function Gallery({ projects, categories, onOpen, action }: GalleryProps) {
  const { view, set, reset } = useLibraryView();
  const [collapsed, toggleCollapsed] = useCollapsed();

  const pool = useMemo(() => projects.filter((p) => inPool(p, view)), [projects, view]);
  const visible = useMemo(() => filterProjects(projects, view, categories), [projects, categories, view]);
  const groups = useMemo(
    () => groupProjects(visible, view.group, view.sort, categories, projects),
    [visible, view.group, view.sort, categories, projects],
  );
  const categoryLabel = (id: string | null) => categories.find((c) => c.id === id)?.label ?? "";

  const card = (p: ImageProject) => (
    <button key={p.id} onClick={() => onOpen(p.id)} className="group text-left flex flex-col gap-2 min-w-0">
      {/* A square frame with the image whole inside it, so every format lines up in tidy rows. */}
      <span className="relative block aspect-square rounded-xl bg-surface border border-border-subtle transition-colors group-hover:border-brand/60 group-hover:bg-surface-2">
        <span className="absolute inset-4 flex items-center justify-center">
          <Thumb p={p} className={`${p.width >= p.height ? "w-full" : "h-full"} shadow-lg`} />
        </span>
      </span>
      <span className="px-0.5 space-y-1">
        <span className="block text-sm text-text-primary leading-snug line-clamp-2 group-hover:text-brand-light">{p.title}</span>
        <span className="flex items-center gap-1.5 text-[11px] text-text-dim font-mono">
          <span className="truncate">{p.formats ? p.formats.map((f) => FORMAT_LABEL[f]).join(" + ") : `${p.width}×${p.height}`}</span>
          {p.group === "templates" && <span className={`${badgeClass} shrink-0 text-brand-light border-brand/40`}>Template</span>}
          <StatusBadge status={p.status} />
        </span>
      </span>
    </button>
  );

  const row = (p: ImageProject) => (
    <button key={p.id} onClick={() => onOpen(p.id)} className="group w-full text-left flex items-center gap-4 px-3 py-2 rounded-lg hover:bg-surface transition-colors">
      <span className="w-20 h-16 shrink-0 flex items-center justify-center">
        <Thumb p={p} className={`${p.width >= p.height ? "w-full" : "h-full"} max-w-full max-h-full`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-sm text-text-primary truncate group-hover:text-brand-light">{p.title}</span>
          {p.group === "templates" && <span className={`${badgeClass} shrink-0 text-brand-light border-brand/40`}>Template</span>}
        </span>
        {p.description && <span className="block text-xs text-text-dim truncate">{p.description}</span>}
      </span>
      <span className="hidden md:block w-40 shrink-0 text-[11px] text-text-dim font-mono truncate">{categoryLabel(p.category)}</span>
      <span className="hidden sm:block w-28 shrink-0 text-[11px] text-text-dim font-mono">
        {p.formats ? p.formats.map((f) => FORMAT_LABEL[f]).join(" + ") : `${p.width}×${p.height}`}
      </span>
      <span className="w-16 shrink-0 flex justify-end">
        <StatusBadge status={p.status} />
      </span>
    </button>
  );

  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="sm:sticky sm:top-0 z-10 bg-bg border-b border-border-subtle px-4 md:px-8 pt-5 pb-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-text-primary">Images</h1>
            <p className="text-xs text-text-dim">
              {visible.length === pool.length ? `${pool.length} images` : `${visible.length} of ${pool.length} images`} · pick one to fill in
              and download
            </p>
          </div>
          {action}
        </div>
        <LibraryFilters projects={pool} categories={categories} view={view} set={set} variant="bar" />
      </div>

      <div className="px-4 md:px-8 py-6 space-y-8">
        {visible.length === 0 && (
          <p className="py-10 text-sm text-text-dim">
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
            <section key={group.key || "-"} className="space-y-3">
              {view.group !== "none" && (
                <button
                  onClick={() => toggleCollapsed(collapseKey)}
                  aria-expanded={open}
                  className="flex items-center gap-2 text-left text-sm font-semibold text-text-primary uppercase tracking-widest hover:text-brand-light"
                >
                  {open ? <ChevronDown className="w-4 h-4 text-text-dim" /> : <ChevronRight className="w-4 h-4 text-text-dim" />}
                  {group.label}
                  <span className="text-xs font-mono font-normal text-text-dim">{group.count}</span>
                </button>
              )}
              {open &&
                group.blocks.map((block) => (
                  <div key={block.label ?? "-"} className="space-y-3">
                    {block.label && <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider">{block.label}</p>}
                    {view.view === "grid" ? (
                      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-4 gap-y-6">{block.items.map(card)}</div>
                    ) : (
                      <div className="space-y-0.5">{block.items.map(row)}</div>
                    )}
                  </div>
                ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
