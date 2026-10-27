// The Library's view of the image projects, shared by the sidebar (components/Library.tsx) and the gallery page
// (components/Gallery.tsx): search, filters, grouping and sorting, kept in the URL so a view can be linked and
// survives going from the gallery to an image and back.
import { useState } from "react";
import { useSearchParams } from "react-router";
import type { ImageCategory, ImageFormat, ImageProject, ImageStatus } from "./types";

export type GroupBy = "category" | "template" | "series" | "format" | "status" | "none";
export type SortBy = "name" | "updated" | "status";
export type View = "list" | "grid";
export type Type = "all" | "images" | "templates";

export const GROUP_BY: { id: GroupBy; label: string }[] = [
  { id: "category", label: "Category" },
  { id: "template", label: "Template" },
  { id: "series", label: "Series" },
  { id: "format", label: "Format" },
  { id: "status", label: "Status" },
  { id: "none", label: "None" },
];
export const SORT_BY: { id: SortBy; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "updated", label: "Newest" },
  { id: "status", label: "Status" },
];
export const TYPES: { id: Type; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "images", label: "Images" },
  { id: "templates", label: "Templates" },
];
export const STATUS_ORDER: ImageStatus[] = ["ready", "draft", "planned", "posted"];
export const STATUS_LABEL: Record<ImageStatus, string> = { ready: "Ready", draft: "Draft", planned: "Planned", posted: "Posted" };
export const FORMAT_ORDER: ImageFormat[] = ["portrait", "square", "landscape", "story", "other"];
export const FORMAT_LABEL: Record<ImageFormat, string> = {
  portrait: "Portrait 4:5",
  square: "Square",
  landscape: "Landscape 16:9",
  story: "Story 9:16",
  other: "Other",
};

/** URL keys for the Library's view and search, beside App's ?template=, so a filtered view can be linked. */
export const PARAM = { query: "q", group: "g", sort: "s", view: "v", category: "c", status: "st", format: "f", type: "t" } as const;
export type ViewKey = keyof typeof PARAM;
export const DEFAULTS: Record<ViewKey, string> = {
  query: "",
  group: "category",
  sort: "name",
  view: "grid",
  category: "all",
  status: "all",
  format: "all",
  type: "all",
};

export function useLibraryView() {
  const [params, setParams] = useSearchParams();
  const pick = <T extends string>(key: ViewKey, allowed: readonly string[]): T => {
    const v = params.get(PARAM[key]);
    return (v && allowed.includes(v) ? v : DEFAULTS[key]) as T;
  };
  const view = {
    query: params.get(PARAM.query) ?? "",
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
export function useCollapsed() {
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

export interface Group {
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

export function groupProjects(items: ImageProject[], groupBy: GroupBy, sort: SortBy, categories: ImageCategory[], all: ImageProject[]): Group[] {
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

export const haystack = (p: ImageProject, categories: ImageCategory[]) =>
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

export type LibraryView = ReturnType<typeof useLibraryView>["view"];

/** The projects the view's search and filters let through; every search word must match. */
export function filterProjects(projects: ImageProject[], view: LibraryView, categories: ImageCategory[]): ImageProject[] {
  const terms = view.query.toLowerCase().split(/\s+/).filter(Boolean);
  return projects.filter(
    (p) =>
      (view.category === "all" || (p.category ?? "") === view.category) &&
      (view.status === "all" || p.status === view.status) &&
      (view.format === "all" || p.format === view.format || p.formats?.includes(view.format)) &&
      (view.type === "all" || (view.type === "templates") === (p.group === "templates")) &&
      terms.every((t) => haystack(p, categories).includes(t)),
  );
}

/** Whether any filter (not the search) is narrowing the view. */
export const isFiltered = (view: LibraryView) =>
  view.category !== "all" || view.status !== "all" || view.format !== "all" || view.type !== "all";
