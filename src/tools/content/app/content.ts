/**
 * Every .md under content/, parsed and grouped by campaign.
 *
 * The files are bundled rather than fetched, and there's no codegen step: when
 * one changes on disk (an edit, or a checkbox ticked through the dev server),
 * Vite hot-reloads this module and the tab shows the file as it now is.
 */

import { KIND } from "./constants";
import type { BriefDoc, Campaign, ContentDoc, LegendDoc, PersonDoc } from "./types";
import { parseDoc } from "./utils/parseDoc";

const FILES = import.meta.glob("/content/**/*.md", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

function load(): Campaign[] {
  const entries = Object.entries(FILES).map(([abs, raw]) => ({ path: abs.replace(/^\//, ""), raw }));
  const ids = [...new Set(entries.map((e) => e.path.split("/")[1]))].sort();

  return ids.map((id) => {
    const files = entries.filter((e) => e.path.split("/")[1] === id);
    // Legends first, so scripts can name their speakers ("washington" → "Washington").
    const legends = files.map((f) => parseDoc(f.path, f.raw)).filter((d): d is LegendDoc => d.kind === "legend");
    const names = Object.fromEntries(legends.map((l) => [l.id, l.short]));
    const docs = files
      .map((f) => parseDoc(f.path, f.raw, names))
      .sort((a, b) => KIND[a.kind].rank - KIND[b.kind].rank || a.path.localeCompare(b.path));
    const brief = (docs.find((d) => d.kind === "brief") as BriefDoc | undefined) ?? null;
    return {
      id,
      title: brief?.title ?? id,
      brief,
      legends: docs.filter((d): d is LegendDoc => d.kind === "legend"),
      people: docs.filter((d): d is PersonDoc => d.kind === "person"),
      docs,
    };
  });
}

export const CAMPAIGNS = load();
export const ALL_DOCS: ContentDoc[] = CAMPAIGNS.flatMap((c) => c.docs);

export const findDoc = (key: string | null) => (key ? ALL_DOCS.find((d) => d.key === key) ?? null : null);
export const findCampaign = (id: string | null) => CAMPAIGNS.find((c) => c.id === id) ?? null;

/** A reference image's URL: they live in `public/content/<campaign>/refs/`. */
export const refUrl = (campaign: string, file: string) => `/content/${campaign}/refs/${file}`;
/** A finished photo's URL: they live in `public/content/<campaign>/photos/`. */
export const photoUrl = (campaign: string, file: string) => `/content/${campaign}/photos/${file}`;
