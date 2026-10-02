export type DocKind = "brief" | "script" | "legend" | "photos" | "page";
export type DocStatus = "draft" | "review" | "locked" | "done" | "blocked" | "archived";
export type ScriptFormat = "vertical" | "landscape";

/** A `## heading` and what follows it, up to the next one. */
export interface DocSection {
  heading: string;
  body: string;
}

/** One `- [ ]` / `- [x]` line. `line` and `source` let the dev server find it again on disk. */
export interface ChecklistItem {
  /** 1-based line in the file. */
  line: number;
  /** The whole line as written, checked against the file before a write. */
  source: string;
  label: string;
  checked: boolean;
  depth: number;
  /** The `##` section it sits under, or null above the first one. */
  section: string | null;
  /** Indented lines right under the item (a photo's `Prompt: …`), or null. */
  detail: string | null;
}

/** One quoted line in a shot, with who says it. */
export interface ShotLine {
  speaker: string | null;
  /** How it's said, from "Caesar, without looking up:". */
  manner: string | null;
  text: string;
}

export interface Shot {
  n: number;
  visual: string;
  /** Framing, angle and movement. */
  camera: string | null;
  /** What happens over the shot, in order. */
  action: string | null;
  /** Effects and ambience; dialogue lives in `lines`. */
  sound: string | null;
  /** Exact on-screen text or UI, for shots that show a screen. */
  screen: string | null;
  lines: ShotLine[];
  /** Unquoted text in the Line field: "Beat.", "Cleopatra side-eyes him." */
  directions: string[];
  /** Image under public/ that replaces the placeholder frame once real stills exist. */
  still: string | null;
  words: number;
  /** Planned length from the heading (`### Shot 1 · 6s`), or null. */
  duration: number | null;
  /** The planned length, or the word-count estimate without one. */
  seconds: number;
  endCard: boolean;
}

/** A supporting character or a set, described once and reused in every shot. */
export interface Entry {
  name: string;
  look: string;
}

interface BaseDoc {
  /** `<campaign>/<id>`, the `?doc=` value. */
  key: string;
  campaign: string;
  id: string;
  /** Repo-relative, e.g. `content/legends/brief.md`. */
  path: string;
  kind: DocKind;
  title: string;
  status: DocStatus;
  /** Rollout week, when the piece goes out. */
  week: number | null;
  raw: string;
  /** Text above the first `##`. */
  intro: string;
  sections: DocSection[];
  checklist: ChecklistItem[];
  /** Problems found while parsing, shown above the doc. */
  warnings: string[];
  /** The frontmatter as written. */
  data: Record<string, unknown>;
}

export interface BriefDoc extends BaseDoc {
  kind: "brief";
  tagline: string | null;
  signoff: string | null;
  url: string | null;
  goal: string | null;
}

export interface ScriptDoc extends BaseDoc {
  kind: "script";
  legends: string[];
  standards: string[];
  format: ScriptFormat;
  /** Target length in seconds. */
  target: number | null;
  endCard: string | null;
  cast: Entry[];
  sets: Entry[];
  shots: Shot[];
}

export interface LegendDoc extends BaseDoc {
  kind: "legend";
  short: string;
  /** The fixed description used for this legend in every shot. */
  look: string | null;
  /** Reference images, in `public/content/<campaign>/refs/`, and what each is for. The first is the portrait. */
  refs: { file: string; use: string }[];
  role: string | null;
  trait: string | null;
  nod: string | null;
  standards: string[];
  slides: number[];
  earnedBy: string | null;
  trustBy: string | null;
  quote: string | null;
  endCard: string | null;
  link: string | null;
}

export interface PhotosDoc extends BaseDoc {
  kind: "photos";
}

export interface PageDoc extends BaseDoc {
  kind: "page";
  url: string | null;
}

export type ContentDoc = BriefDoc | ScriptDoc | LegendDoc | PhotosDoc | PageDoc;

export interface Campaign {
  id: string;
  title: string;
  brief: BriefDoc | null;
  legends: LegendDoc[];
  docs: ContentDoc[];
}
