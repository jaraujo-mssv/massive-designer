// Field values in a URL, for an image link (/api/render/<id>.jpg?…) and an edit link (/images?i=<id>&…).
// Shared by the Images tab, the render API (api/) and llms.txt (scripts/image/build-index.mjs, which imports this
// file directly through Node's type stripping), so keep it free of imports and of TypeScript-only syntax
// beyond types.
//
// The values come from AI chats as often as from people, so reading them is forgiving: `amp;` left on a key,
// a field id in another case, a select's label for its value, yes/no for a toggle.

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

/** URL keys a field id can't use: the Library's view (i, g, s, v, c, st, f, t) and the render endpoint's own. */
export const RESERVED_PARAMS = ["i", "g", "s", "v", "c", "st", "f", "t", "id", "scale", "download"];

/** Longest text value a link may carry. */
export const MAX_TEXT = 300;

const TRUE = ["true", "1", "yes", "on"];
const FALSE = ["false", "0", "no", "off"];

/** One raw URL value as the field's value, or why it can't be used. */
export function coerce(field: ParamField, raw: string): { value: string | boolean } | { error: string } {
  const text = raw.trim();
  switch (field.type) {
    case "toggle": {
      if (TRUE.includes(text.toLowerCase())) return { value: true };
      if (FALSE.includes(text.toLowerCase())) return { value: false };
      return { error: `${field.id} is on or off: use true or false.` };
    }
    case "select": {
      const options = field.options ?? [];
      const lower = text.toLowerCase();
      const match =
        options.find((o) => o.value === text) ??
        options.find((o) => o.value.toLowerCase() === lower || o.label.toLowerCase() === lower);
      if (match) return { value: match.value };
      return { error: `${field.id} must be one of: ${options.map((o) => o.value).join(", ")}.` };
    }
    case "image": {
      if (/^https?:\/\/[^\s]+$/i.test(text)) return { value: text };
      // The project's own files, as its defaults name them.
      if (/^assets\/[^?#\\]+$/.test(text) && !text.split("/").includes("..")) return { value: text };
      return { error: `${field.id} must be a direct https:// link to an image (JPG, PNG, WebP, GIF, AVIF or SVG).` };
    }
    default: {
      if (raw.length > MAX_TEXT) return { error: `${field.id} is ${raw.length} characters; the most is ${MAX_TEXT}.` };
      return { value: raw };
    }
  }
}

/**
 * The field values in a query string. Keys match field ids in any case, with `amp;` (a doubly escaped &)
 * stripped; reserved keys are skipped and anything else is reported as unknown.
 */
export function readParams(
  fields: ParamField[],
  params: URLSearchParams,
): { values: ParamValues; errors: string[]; unknown: string[] } {
  const values: ParamValues = {};
  const errors: string[] = [];
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
    if ("error" in result) errors.push(result.error);
    else values[field.id] = result.value;
  }
  return { values, errors, unknown };
}

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

/** The deployed site, for links that must work outside it (llms.txt, the "Use with AI" prompt). */
export const SITE_URL = "https://massive-designer.vercel.app";

/** The image link's path, and the edit link's path up to its field values: one place for the URL shapes. */
export const renderPath = (id: string) => `/api/render/${id}.jpg`;
export const editPath = (id: string) => `/images?i=${encodeURIComponent(id)}`;

/** What a teammate pastes into an AI chat, before saying what they need. */
export const AI_PROMPT = `Read ${SITE_URL}/llms.txt and use it to make me a Massive image. Here's what I need: `;

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
    `2. Build the image link: \`${base}/api/render/<id>.jpg?<param>=<value>&…\``,
    "   - Use only that image's params. Leave a param out to keep its default.",
    "   - URL-encode every value (a space is %20).",
    `   - Text: as it should read, up to ${MAX_TEXT} characters. Select: one of the listed values. Toggle: true or false.`,
    "   - Image: a direct https:// link to the image file (JPG, PNG, WebP, GIF, AVIF or SVG), not a page that shows it. Share pages from Unsplash, Google Drive or Dropbox (`dl=0`) won't work.",
    "   - Optional: `scale=1` for a 1× image (the default is 2×), `download=1` to download it instead of showing it.",
    `3. Build the edit link from the same params: \`${base}/images?i=<id>&<param>=<value>&…\`. It opens the design in Massive Designer, filled in, to tweak it, drop in a photo and download it.`,
    "4. Reply with both links as plain links, not as markdown images. You don't need to open the image link yourself: it renders when the person clicks it.",
    "5. A photo attached to the chat (not a link) can't go in a URL. Give the edit link and tell the person to drop the photo into the image field there.",
    "",
    ...(example && sample
      ? [
          `Example: "A ${example.title.replace(/\s*\(template\)\s*$/i, "").toLowerCase()} called 'Hotel Prices Without a Browser' with this photo: https://example.com/hotel.jpg"`,
          `- Image: ${base}${renderPath(example.id)}?${sample}`,
          `- Edit: ${base}${editPath(example.id)}&${sample}`,
          "",
        ]
      : []),
    `Search every image: ${base}/api/images?q=<words> (add &format=json for JSON). One image's details: ${base}/api/images?id=<id>.`,
  ].join("\n");
}
