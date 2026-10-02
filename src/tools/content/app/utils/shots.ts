import { MIN_SHOT_SECONDS, WORDS_PER_SECOND } from "../constants";
import type { Entry, Shot, ShotLine } from "../types";

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

/**
 * Splits a Line cell into who says what.
 *
 * The scripts write lines the way the outline does:
 *   `VO: "…" Hercules: "Labor 13. Let's go."`
 *   `"Is that a pre-ticked box?" Designer: "It's... a design choice."`
 *   `Caesar, without looking up: "I saw that."`
 *   `VO: "Some companies pay for a legend." Beat. "Ours earned it."`
 *
 * A quote with a `Name:` right before it is that person's. A bare quote carries
 * on the previous speaker in the cell ("Beat." doesn't change who's talking), or
 * is the shot's legend when it opens the cell. Anything unquoted between lines is
 * a stage direction.
 */
export function parseLineCell(cell: string, defaultSpeaker: string | null): { lines: ShotLine[]; directions: string[] } {
  const lines: ShotLine[] = [];
  const directions: string[] = [];
  const quote = /"([^"]*)"/g;
  let last = 0;
  let previous: string | null = null;

  for (let m = quote.exec(cell); m; m = quote.exec(cell)) {
    const gap = cell.slice(last, m.index).trim();
    last = m.index + m[0].length;

    let label: string | null = null;
    let lead = gap;
    if (gap.endsWith(":")) {
      // The label is whatever follows the last full stop in the gap.
      const cut = Math.max(gap.lastIndexOf(". "), gap.lastIndexOf("? "), gap.lastIndexOf("! "));
      label = gap.slice(cut + 1, -1).trim();
      lead = cut >= 0 ? gap.slice(0, cut + 1).trim() : "";
    }
    if (lead) directions.push(lead);

    let speaker = previous ?? defaultSpeaker;
    let manner: string | null = null;
    if (label) {
      const comma = label.indexOf(",");
      speaker = comma >= 0 ? label.slice(0, comma).trim() : label;
      manner = comma >= 0 ? label.slice(comma + 1).trim() : null;
    }
    previous = speaker;
    lines.push({ speaker, manner, text: m[1].trim() });
  }

  const tail = cell.slice(last).trim();
  if (tail) directions.push(tail);
  return { lines, directions };
}

/**
 * The legend a shot belongs to: the only one in the script, or, in a script with
 * several (the film), the first one its visual names.
 */
function legendFor(visual: string, legends: string[]): string | null {
  if (legends.length === 1) return legends[0];
  let best: { name: string; at: number } | null = null;
  for (const name of legends) {
    const at = visual.indexOf(name);
    if (at >= 0 && (!best || at < best.at)) best = { name, at };
  }
  return best?.name ?? null;
}

const HEADING = /^###\s+Shot\s+(\d+)(?:\s*·\s*(\d+(?:\.\d+)?)\s*s)?/i;
const FIELD = /^[-*]\s+\*\*([\w ]+):\*\*\s*(.*)$/;

/** Splits a section on its `### ` headings: `[heading, body lines]` per block. */
function blocks(body: string): { heading: string; lines: string[] }[] {
  const out: { heading: string; lines: string[] }[] = [];
  for (const line of body.split("\n")) {
    if (line.startsWith("### ")) out.push({ heading: line, lines: [] });
    else out[out.length - 1]?.lines.push(line);
  }
  return out;
}

/**
 * Reads the `## Shots` blocks:
 *
 *   ### Shot 1 · 6s
 *   - **Visual:** …
 *   - **Camera:** …
 *   - **Action:** …
 *   - **Screen:** …   (shots that show a screen)
 *   - **Line:** VO: "…"
 *   - **Sound:** …
 *   - **Still:** /content/legends/r1-s1.jpg   (once real stills exist)
 *
 * The `· 6s` is the planned length; without it the length is estimated from
 * the words spoken.
 */
export function parseShots(body: string, legends: string[]): { shots: Shot[]; warnings: string[] } {
  const warnings: string[] = [];
  const shots = blocks(body).flatMap((block, i): Shot[] => {
    const head = HEADING.exec(block.heading);
    if (!head) {
      warnings.push(`"${block.heading}" isn't a shot heading; write "### Shot 1 · 6s".`);
      return [];
    }
    const fields: Record<string, string> = {};
    for (const line of block.lines) {
      const m = FIELD.exec(line.trim());
      if (m) fields[m[1].toLowerCase()] = m[2].trim();
    }
    const visual = fields.visual ?? "";
    const line = fields.line ?? "";
    const { lines, directions } = parseLineCell(line, legendFor(visual, legends));
    const words = lines.reduce((n, l) => n + countWords(l.text), 0);
    const duration = head[2] ? Number(head[2]) : null;
    return [
      {
        n: Number(head[1]) || i + 1,
        visual,
        camera: fields.camera ?? null,
        action: fields.action ?? null,
        sound: fields.sound ?? null,
        screen: fields.screen ?? null,
        lines,
        directions,
        still: fields.still ?? null,
        words,
        duration,
        seconds: duration ?? Math.max(MIN_SHOT_SECONDS, Math.round((words / WORDS_PER_SECOND) * 10) / 10),
        endCard: /^end card\b/i.test(visual),
      },
    ];
  });
  if (!shots.length) warnings.push("The Shots section has no shots. Start each with \"### Shot 1 · 6s\".");
  return { shots, warnings };
}

/** `### Name` followed by a paragraph, for a script's Cast and Sets. Text above the first `###` is a note, skipped. */
export function parseEntries(body: string): Entry[] {
  return blocks(body).map((b) => ({ name: b.heading.slice(4).trim(), look: b.lines.join(" ").replace(/\s+/g, " ").trim() }));
}

export const totalSeconds = (shots: Shot[]) => Math.round(shots.reduce((s, x) => s + x.seconds, 0));

export const fmtSeconds = (s: number) =>
  s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : `${Math.round(s)}s`;
