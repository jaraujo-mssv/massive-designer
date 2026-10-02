import { parse as parseYaml } from "yaml";
import { KIND_IDS, STATUS_IDS } from "../constants";
import type { ContentDoc, DocKind, DocSection, DocStatus } from "../types";
import { parseChecklist } from "./checklist";
import { parseEntries, parseShots } from "./shots";

const str = (v: unknown): string | null => (v === null || v === undefined || v === "" ? null : String(v));
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : []);
const nums = (v: unknown): number[] => strs(v).map(Number).filter((n) => !Number.isNaN(n));

/** Splits off the `---` frontmatter. `bodyLine` is the 1-based file line the body starts on. */
function splitFrontmatter(raw: string): { data: Record<string, unknown>; body: string[]; bodyLine: number; error: string | null } {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") return { data: {}, body: lines, bodyLine: 1, error: "No frontmatter." };
  const end = lines.indexOf("---", 1);
  if (end < 0) return { data: {}, body: lines, bodyLine: 1, error: "Frontmatter is never closed with ---." };
  try {
    const data = (parseYaml(lines.slice(1, end).join("\n")) ?? {}) as Record<string, unknown>;
    return { data, body: lines.slice(end + 1), bodyLine: end + 2, error: null };
  } catch (err) {
    return { data: {}, body: lines.slice(end + 1), bodyLine: end + 2, error: `Frontmatter: ${(err as Error).message}` };
  }
}

function splitSections(body: string[]): { intro: string; sections: DocSection[] } {
  const sections: DocSection[] = [];
  const intro: string[] = [];
  let current: { heading: string; lines: string[] } | null = null;
  for (const line of body) {
    if (line.startsWith("## ")) {
      if (current) sections.push({ heading: current.heading, body: current.lines.join("\n").trim() });
      current = { heading: line.slice(3).trim(), lines: [] };
    } else (current ? current.lines : intro).push(line);
  }
  if (current) sections.push({ heading: current.heading, body: current.lines.join("\n").trim() });
  return { intro: intro.join("\n").trim(), sections };
}

export const section = (doc: { sections: DocSection[] }, heading: string) =>
  doc.sections.find((s) => s.heading.toLowerCase() === heading.toLowerCase()) ?? null;

/**
 * One markdown file to a doc.
 *
 * `path` is repo-relative (`content/legends/scripts/reel-1-washington.md`): the
 * campaign is the folder under content/, and the id is the file name.
 * `legendNames` turns a script's `legends: [washington]` into the names its
 * lines use ("Washington"), so a bare quote can be given to the right speaker.
 */
export function parseDoc(path: string, raw: string, legendNames: Record<string, string> = {}): ContentDoc {
  const [, campaign] = path.split("/");
  const id = path.split("/").pop()!.replace(/\.md$/, "");
  const { data, body, bodyLine, error } = splitFrontmatter(raw);
  const { intro, sections } = splitSections(body);
  const warnings: string[] = error ? [error] : [];

  let kind = data.kind as DocKind;
  if (!KIND_IDS.includes(kind)) {
    warnings.push(`Unknown kind "${String(data.kind ?? "")}", read as a brief. Use one of: ${KIND_IDS.join(", ")}.`);
    kind = "brief";
  }
  let status = (data.status ?? "draft") as DocStatus;
  if (!STATUS_IDS.includes(status)) {
    warnings.push(`Unknown status "${String(data.status)}", read as draft. Use one of: ${STATUS_IDS.join(", ")}.`);
    status = "draft";
  }

  const base = {
    key: `${campaign}/${id}`,
    campaign,
    id,
    path,
    title: str(data.title) ?? id,
    status,
    week: data.week === undefined || data.week === null ? null : Number(data.week),
    raw,
    intro,
    sections,
    checklist: parseChecklist(body, bodyLine),
    warnings,
    data,
  };

  switch (kind) {
    case "script": {
      const legends = strs(data.legends);
      const names = legends.map((l) => legendNames[l] ?? l[0].toUpperCase() + l.slice(1));
      const shotsSection = section(base, "Shots");
      const parsed = shotsSection ? parseShots(shotsSection.body, names) : { shots: [], warnings: ["No ## Shots section."] };
      const format = data.format === "landscape" ? "landscape" : "vertical";
      if (data.format && data.format !== format) warnings.push(`Unknown format "${String(data.format)}", read as vertical.`);
      return {
        ...base,
        kind,
        legends,
        standards: strs(data.standards),
        format,
        target: data.target ? Number(data.target) : null,
        endCard: str(data.endCard),
        cast: parseEntries(section(base, "Cast")?.body ?? ""),
        sets: parseEntries(section(base, "Sets")?.body ?? ""),
        shots: parsed.shots,
        warnings: [...warnings, ...parsed.warnings],
      };
    }
    case "legend":
      return {
        ...base,
        kind,
        short: str(data.short) ?? base.title,
        look: str(data.look),
        refs: (Array.isArray(data.refs) ? data.refs : [])
          .map((r: { file?: unknown; use?: unknown }) => ({ file: str(r?.file), use: str(r?.use) ?? "" }))
          .filter((r): r is { file: string; use: string } => r.file !== null),
        role: str(data.role),
        trait: str(data.trait),
        nod: str(data.nod),
        standards: strs(data.standards),
        slides: nums(data.slides),
        earnedBy: str(data.earnedBy),
        trustBy: str(data.trustBy),
        quote: str(data.quote),
        endCard: str(data.endCard),
        link: str(data.link),
      };
    case "brief":
      return { ...base, kind, tagline: str(data.tagline), signoff: str(data.signoff), url: str(data.url), goal: str(data.goal) };
    case "page":
      return { ...base, kind, url: str(data.url) };
    case "photos":
      return { ...base, kind };
  }
}
