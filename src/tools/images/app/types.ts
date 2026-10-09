/** One editable value of an image project, from its meta.json. */
export interface ImageField {
  id: string;
  label: string;
  type: "text" | "image" | "toggle" | "select";
  default: string | boolean;
  /** A select's choices; `value` is what the page receives. */
  options?: { value: string; label: string }[];
}

export type FieldValues = Record<string, string | boolean>;

/** One image project, as written by scripts/image/build-index.mjs. */
export interface ImageProject {
  id: string;
  title: string;
  description: string | null;
  group: "massive" | "templates";
  /** Projects in the same series are listed together (e.g. "Jason 15K"). */
  series: string | null;
  status: string;
  tags: string[];
  /** Where it came from, e.g. the video it's a still of. */
  source: string | null;
  width: number;
  height: number;
  fields: ImageField[];
  /** URL of the project's index.html. */
  path: string;
  /** URL of thumb.jpg, written by `npm run image:render`. */
  thumb: string | null;
}
