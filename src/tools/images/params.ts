// Field values in a URL, for an image link (/api/render/<id>.jpg?…) and an edit link (/images?template=<id>&…).
// Shared by the Images tab, the render API (api/) and llms.txt (scripts/image/build-index.mjs, which imports this
// file directly through Node's type stripping), so keep it free of imports and of TypeScript-only syntax
// beyond types.
//
// The values come from AI chats as often as from people, so reading them is forgiving: `amp;` left on a key,
// a field id in another case, a select's label for its value, yes/no for a toggle. What can't be read is said
// plainly, field by field, in the words the Images tab shows next to the field.

/** A field as meta.json describes it (the same shape as ImageField in app/types.ts). */
export interface ParamField {
  id: string;
  label: string;
  type: "text" | "image" | "toggle" | "select";
  default: string | boolean;
  options?: { value: string; label: string }[];
  hint?: string;
}

export type ParamValues = Record<string, string | boolean>;

/**
 * URL keys a field id can't use: the image (`template`, and `i` from older links), the Library's search and view
 * (q, g, s, v, c, st, f, t) and the render endpoint's own.
 */
export const RESERVED_PARAMS = ["template", "i", "q", "g", "s", "v", "c", "st", "f", "t", "id", "scale", "download"];

/** Longest text value a link may carry. */
export const MAX_TEXT = 300;

/** What the Images tab says when a photo link doesn't load, or isn't a link at all. */
export const PHOTO_ERROR = "Couldn't load that photo. Check the link is public and points to an image.";

const TRUE = ["true", "1", "yes", "on"];
const FALSE = ["false", "0", "no", "off"];

/** "a", "a or b", "a, b or c". */
const either = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`);

/** One raw URL value as the field's value, or why it can't be used. */
export function coerce(field: ParamField, raw: string): { value: string | boolean } | { error: string } {
  const text = raw.trim();
  switch (field.type) {
    case "toggle": {
      if (TRUE.includes(text.toLowerCase())) return { value: true };
      if (FALSE.includes(text.toLowerCase())) return { value: false };
      return { error: `${field.id} must be true or false.` };
    }
    case "select": {
      const options = field.options ?? [];
      const lower = text.toLowerCase();
      const match =
        options.find((o) => o.value === text) ??
        options.find((o) => o.value.toLowerCase() === lower || o.label.toLowerCase() === lower);
      if (match) return { value: match.value };
      return { error: `${field.id} must be ${either(options.map((o) => o.value))}.` };
    }
    case "image": {
      if (/^https?:\/\/[^\s]+$/i.test(text)) return { value: text };
      // The project's own files, as its defaults name them.
      if (/^assets\/[^?#\\]+$/.test(text) && !text.split("/").includes("..")) return { value: text };
      return { error: PHOTO_ERROR };
    }
    default: {
      if (raw.length > MAX_TEXT) return { error: `${field.id} is ${raw.length} characters; the most is ${MAX_TEXT}.` };
      return { value: raw };
    }
  }
}

/**
 * The field values in a query string. Keys match field ids in any case, with `amp;` (a doubly escaped &)
 * stripped; reserved keys are skipped and anything else is reported as unknown. Errors are by field id.
 */
export function readParams(
  fields: ParamField[],
  params: URLSearchParams,
): { values: ParamValues; errors: Record<string, string>; unknown: string[] } {
  const values: ParamValues = {};
  const errors: Record<string, string> = {};
  const unknown: string[] = [];
  for (const [rawKey, raw] of params) {
    const key = rawKey.replace(/^(amp;)+/i, "");
    if (RESERVED_PARAMS.includes(key)) continue;
    const field = fields.find((f) => f.id === key) ?? fields.find((f) => f.id.toLowerCase() === key.toLowerCase());
    if (!field) {
      unknown.push(key);
      continue;
    }
    const result = coerce(field, raw);
    if ("error" in result) errors[field.id] = result.error;
    else values[field.id] = result.value;
  }
  return { values, errors, unknown };
}

/** Says which params a link has that the image doesn't. */
export const unknownMessage = (unknown: string[], fields: ParamField[]) =>
  `Unknown field${unknown.length > 1 ? "s" : ""} ${unknown.map((k) => `"${k}"`).join(", ")}. This template has: ${fields.map((f) => f.id).join(", ")}.`;

/** The values a link can carry: everything but uploaded photos (data: URLs). */
export const linkable = (values: ParamValues): ParamValues =>
  Object.fromEntries(Object.entries(values).filter(([, v]) => !(typeof v === "string" && v.startsWith("data:"))));

/**
 * The query string for these values: only the ones that differ from the defaults, in field id order,
 * with spaces as %20. Empty when everything is a default.
 */
export function canonicalQuery(fields: ParamField[], values: ParamValues): string {
  return [...fields]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .filter((f) => values[f.id] !== undefined && values[f.id] !== f.default)
    .map((f) => `${encodeURIComponent(f.id)}=${encodeURIComponent(String(values[f.id]))}`)
    .join("&");
}

/** The image field that a pasted or dropped photo goes to: `photo` if there is one, else the first. */
export const primaryImageField = <F extends ParamField>(fields: F[]): F | undefined =>
  fields.find((f) => f.type === "image" && f.id === "photo") ?? fields.find((f) => f.type === "image");

/** The deployed site, for links that must work outside it (llms.txt, the "Use with AI" prompt). */
export const SITE_URL = "https://massive-designer.vercel.app";

/** The image link's path, and the edit link's path up to its field values: one place for the URL shapes. */
export const renderPath = (id: string) => `/api/render/${id}.jpg`;
export const editPath = (id: string) => `/images?template=${encodeURIComponent(id)}`;

/** A field as the "Use with AI" prompt lists it: `wash (standard | strong; strong for bright photos)`. */
function promptParam(f: ParamField): string {
  const what =
    f.type === "select"
      ? (f.options ?? []).map((o) => o.value).join(" | ")
      : f.type === "toggle"
        ? "true | false"
        : f.type === "image"
          ? "URL"
          : "text";
  const hint = f.hint ? `${f.type === "select" || f.type === "toggle" ? ";" : ","} ${f.hint[0].toLowerCase()}${f.hint.slice(1)}` : "";
  return `${f.id} (${what}${hint})`;
}

/** What "Use with AI" copies: how to make an image link, and every template with its fields. */
export function aiPrompt(templates: { id: string; width: number; height: number; fields: ParamField[] }[], site = SITE_URL): string {
  return [
    `You make images with Massive Designer: ${site}/images`,
    "",
    "1. Pick the template that fits the request (list below).",
    `2. Build a link with that template's fields as parameters: ${site}/images?template=<template>&<field>=<value>&…`,
    "   Encode spaces and symbols. Leave a field out to keep the template's default.",
    "3. Photo:",
    "   - If the person gave a public photo link, add it as photo=<link>.",
    "   - If they attached a file or the photo is on their computer, leave photo out",
    '     and tell them: "Open the link and paste or drop your photo into the Photo field."',
    "4. Give the person the link. They check the preview and click Download JPG.",
    "",
    "Templates:",
    ...templates.map((t) => `- ${t.id} (${t.width}x${t.height}): ${t.fields.map(promptParam).join(", ")}`),
  ].join("\n");
}

// --- Describing images to an AI: public/llms.txt (scripts/image/build-index.mjs) and GET /api/images ---

/** What the descriptions need from an index.json entry. */
export interface DescribedProject {
  id: string;
  title: string;
  description: string | null;
  group: string;
  category: string | null;
  width: number;
  height: number;
  fields: ParamField[];
  path: string | null;
}

const quote = (v: string | boolean) => (typeof v === "boolean" ? String(v) : JSON.stringify(v));

function describeParam(f: ParamField): string {
  const what =
    f.type === "select"
      ? `one of ${(f.options ?? []).map((o) => `\`${o.value}\` (${o.label})`).join(", ")}; default \`${f.default}\``
      : f.type === "toggle"
        ? `true or false; default ${f.default}`
        : f.type === "image"
          ? "a direct https:// link to an image; default: the design's own"
          : `text; default ${quote(f.default)}`;
  return `- \`${f.id}\`: ${f.label}. ${what[0].toUpperCase()}${what.slice(1)}.${f.hint ? ` ${f.hint}` : ""}`;
}

/** One image in full: what it is, every param, and its links with the defaults. */
export function describeProject(p: DescribedProject, base: string): string {
  return [
    `### ${p.title}`,
    "",
    `id \`${p.id}\` · ${p.width}×${p.height}${p.category ? ` · ${p.category}` : ""}${p.group === "templates" ? " · template" : ""}`,
    "",
    ...(p.description ? [p.description, ""] : []),
    ...(p.fields.length ? ["Params:", ...p.fields.map(describeParam), ""] : ["No params: it renders as designed.", ""]),
    `Image link (defaults): ${base}${renderPath(p.id)}`,
    `Edit link: ${base}${editPath(p.id)}`,
    `Thumbnail: ${base}/image-projects/${p.id}/thumb.jpg`,
  ].join("\n");
}

/** One image as a line, with the link to its details. */
export const listProject = (p: DescribedProject, base: string) =>
  `- ${p.title} (\`${p.id}\`, ${p.width}×${p.height}): ${base}/api/images?id=${p.id}`;

/** Images that can be rendered (not Planned), templates first, each group by title. */
export function renderable<T extends DescribedProject>(projects: T[]): T[] {
  const rank = (p: T) => (p.group === "templates" ? 0 : 1);
  return projects.filter((p) => p.path).sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
}

/** How to turn an image into a link, for an AI that has never seen this site. */
export function agentGuide(base: string, example?: DescribedProject): string {
  const text = example?.fields.find((f) => f.type === "text");
  const image = example?.fields.find((f) => f.type === "image");
  const sample = example && [
    text && `${text.id}=${encodeURIComponent("Hotel Prices Without a Browser")}`,
    image && `${image.id}=${encodeURIComponent("https://example.com/hotel.jpg")}`,
  ].filter(Boolean).join("&");
  return [
    "## How to make an image",
    "",
    "1. Pick an image. Templates are made to be filled in; the other images are finished designs that can be re-rendered with changes.",
    `2. Build the link: \`${base}/images?template=<id>&<param>=<value>&…\``,
    "   - Use only that image's params. Leave a param out to keep its default.",
    "   - URL-encode every value (a space is %20).",
    `   - Text: as it should read, up to ${MAX_TEXT} characters. Select: one of the listed values. Toggle: true or false.`,
    "   - Photo: a public link to the image file (JPG, PNG, WebP, GIF, AVIF or SVG, up to 15 MB), not a page that shows it. Share pages from Unsplash, Google Drive or Dropbox (`dl=0`) won't work.",
    "3. If the person attached the photo or has it on their computer, leave the photo param out and tell them: \"Open the link and paste or drop your photo into the Photo field.\"",
    "4. Give the person the link, as a plain link (not a markdown image). It opens the design in Massive Designer, filled in; they check the preview and click Download JPG.",
    `5. For the finished JPG straight away, the same params work on \`${base}/api/render/<id>.jpg?<param>=<value>&…\` (photo links only; \`scale=1\` for 1×, \`download=1\` to download). You don't need to open it yourself: it renders when the person clicks it.`,
    "",
    ...(example && sample
      ? [
          `Example: "A ${example.title.replace(/\s*\(template\)\s*$/i, "").toLowerCase()} called 'Hotel Prices Without a Browser' with this photo: https://example.com/hotel.jpg"`,
          `- Link: ${base}${editPath(example.id)}&${sample}`,
          `- JPG: ${base}${renderPath(example.id)}?${sample}`,
          "",
        ]
      : []),
    `Search every image: ${base}/api/images?q=<words> (add &format=json for JSON). One image's details: ${base}/api/images?id=<id>.`,
  ].join("\n");
}
