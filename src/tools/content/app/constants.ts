import { Browser, Camera, Crown, FilmSlate, Notebook, type Icon } from "@phosphor-icons/react";
import type { DocKind, DocStatus, ScriptFormat } from "./types";

/**
 * How each status reads, and where it sorts.
 *
 * `locked` is the coral one: a locked script is the thing a shoot is waiting on.
 * `archived` is deliberately the quietest thing on screen, and sorts last.
 */
export const STATUS: Record<DocStatus, { label: string; className: string; rank: number }> = {
  locked: { label: "Locked", className: "border-brand/40 bg-brand/15 text-brand-light", rank: 0 },
  review: { label: "In review", className: "border-sky-500/30 bg-sky-500/10 text-sky-300", rank: 1 },
  draft: { label: "Draft", className: "border-border-hov text-text-dim", rank: 2 },
  blocked: { label: "Blocked", className: "border-amber-500/30 bg-amber-500/10 text-amber-300", rank: 3 },
  done: { label: "Done", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", rank: 4 },
  archived: { label: "Archived", className: "border-border-subtle text-text-dim/60", rank: 5 },
};

export const STATUS_IDS = Object.keys(STATUS) as DocStatus[];

/** How each kind reads, and the list order inside a campaign. */
export const KIND: Record<DocKind, { label: string; plural: string; Icon: Icon; className: string; rank: number }> = {
  brief: { label: "Brief", plural: "Briefs", Icon: Notebook, className: "text-text-mid", rank: 0 },
  script: { label: "Script", plural: "Scripts", Icon: FilmSlate, className: "text-violet-400", rank: 1 },
  legend: { label: "Legend", plural: "Legends", Icon: Crown, className: "text-amber-300", rank: 2 },
  photos: { label: "Photos", plural: "Photos", Icon: Camera, className: "text-sky-400", rank: 3 },
  page: { label: "Page", plural: "Pages", Icon: Browser, className: "text-emerald-400", rank: 4 },
};

export const KIND_IDS = Object.keys(KIND) as DocKind[];

/** True frame sizes, in video pixels. */
export const FORMATS: Record<ScriptFormat, { w: number; h: number; label: string }> = {
  vertical: { w: 1080, h: 1920, label: "9:16" },
  landscape: { w: 1920, h: 1080, label: "16:9" },
};

/** Speaking rate for the length estimate, the same one the SparkTray scripts use. */
export const WORDS_PER_SECOND = 2.6;
/** No shot is shorter than this, however little is said in it. */
export const MIN_SHOT_SECONDS = 2;

export const WRITE_URL = "/api/content";

export type ScriptView = "script" | "animatic";
export const SCRIPT_VIEWS: { id: ScriptView; label: string }[] = [
  { id: "script", label: "Script" },
  { id: "animatic", label: "Animatic" },
];
