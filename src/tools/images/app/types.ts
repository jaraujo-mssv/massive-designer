/** One editable value of an image project, from its meta.json. */
export interface ImageField {
  id: string;
  label: string;
  type: "text" | "image" | "toggle" | "select";
  default: string | boolean;
  /** A select's choices, or an image field's ready-made photos (picked from thumbnails); `value` is what the page receives. */
  options?: { value: string; label: string }[];
  /** How to fill it in, for people and for AI chats (shown under the field and in llms.txt). */
  hint?: string;
}

export type FieldValues = Record<string, string | boolean>;

/** A theme from public/image-projects/categories.json, in Library order. */
export interface ImageCategory {
  id: string;
  label: string;
  description: string;
}

export type ImageStatus = "planned" | "draft" | "ready" | "posted";
export type ImageFormat = "portrait" | "square" | "landscape" | "story" | "other";

/** One image project, or a Planned entry, as written by scripts/image/build-index.mjs. */
export interface ImageProject {
  id: string;
  title: string;
  description: string | null;
  group: "massive" | "templates";
  /** Theme id from categories.json. */
  category: string | null;
  /** The template project it's built on; for Planned entries also "video:<id>" (a still of a video) or "new". */
  template: string | null;
  /** Projects in the same series are listed together (e.g. "Jason 15K"). */
  series: string | null;
  status: ImageStatus;
  tags: string[];
  /** Where it came from, e.g. the video it's a still of. */
  source: string | null;
  width: number;
  height: number;
  format: ImageFormat;
  /** Planned entries: every format the plan asks for. */
  formats: ImageFormat[] | null;
  /** ISO time of the last change to the page, its meta or its assets. */
  updated: string | null;
  /** Planned entries: what to make. */
  brief: string | null;
  fields: ImageField[];
  /** URL of the project's index.html; null for Planned entries. */
  path: string | null;
  /** URL of thumb.jpg, written by `npm run image:render`. */
  thumb: string | null;
}

export interface ImageIndex {
  categories: ImageCategory[];
  projects: ImageProject[];
}
