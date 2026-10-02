import type { Campaign, ChecklistItem, LegendDoc, PersonDoc, PhotosDoc } from "../types";
import { section } from "./parseDoc";

/** `**Washington:** …` → "Washington". Items without one are group shots. */
export const OWNER = /^\*\*([^*]+):\*\*\s*/;

/** One `Name: value` line from the indented lines under an item (`Prompt:`, `Image:`). */
const fieldOf = (item: ChecklistItem, name: string) =>
  item.detail
    ?.split("\n")
    .find((l) => l.toLowerCase().startsWith(`${name.toLowerCase()}:`))
    ?.slice(name.length + 1)
    .trim() || null;

/** The photo's image prompt. */
export const promptOf = (item: ChecklistItem) => fieldOf(item, "Prompt");
/** The generated photo, a file in `public/content/<campaign>/photos/`, once there is one. */
export const imageOf = (item: ChecklistItem) => fieldOf(item, "Image");

/**
 * Whether a photo shows Massive branding: only when its scene describes the logo
 * (the backdrop, the banner, the reception wall, the billboard). Those get the
 * logo images; every other photo is told to show none.
 */
const BRANDED = /Massive logo|banner printed with the Massive/i;
export const isBranded = (item: ChecklistItem) => BRANDED.test(promptOf(item) ?? "");
/** The official logo, one version per background; the prompt says which goes where. */
export const LOGOS = [
  { file: "massive-logo-light-bg.png", label: "Logo, light", use: "the Massive logo for light surfaces such as a white backdrop or banner", who: null },
  { file: "massive-logo-dark-bg.png", label: "Logo, dark", use: "the Massive logo for dark surfaces such as charcoal walls", who: null },
];

/**
 * The cities the photos happen in, and the names and landmarks that place a
 * prompt in one. A prompt should match one city (outdoors) or none (indoors);
 * matching two is a mix-up the card warns about.
 */
const CITIES: { name: string; terms: RegExp }[] = [
  { name: "Prague", terms: /Prague|Karlín|Charles Bridge|Old Town Square|Vltava/i },
  { name: "San Francisco", terms: /San Francisco|Embarcadero|SoMa|cable car|Bay Bridge|Golden Gate|Highway 101/i },
];
export const citiesIn = (item: ChecklistItem) => CITIES.filter((c) => c.terms.test(promptOf(item) ?? "")).map((c) => c.name);

/** What a reference shows, for its button: `washington-full.jpg` → "Full body". */
const KINDS: Record<string, string> = { new: "Portrait", face: "Face", full: "Full body", mask: "Mask", old: "Period" };
export const refLabel = (file: string) =>
  LOGOS.find((l) => l.file === file)?.label ?? KINDS[/-(\w+)\.\w+$/.exec(file)?.[1] ?? ""] ?? file;

/**
 * Who a photo shows, the photo's own legend first:
 * - legends: the owner, or all of them for a group shot unless the prompt says
 *   they're out of frame (the audience shot); a legend's photo can still show
 *   another legend by name (Caesar beside Hercules);
 * - people (Jason Grad): whenever the prompt names them.
 */
export function castIn(item: ChecklistItem, campaign: Campaign): (LegendDoc | PersonDoc)[] {
  const prompt = promptOf(item) ?? "";
  const owner = OWNER.exec(item.label)?.[1];
  const legends = !owner
    ? /legends are not in frame/i.test(prompt)
      ? []
      : campaign.legends
    : campaign.legends
        .filter((l) => l.short === owner || prompt.includes(l.short))
        .sort((a, b) => Number(b.short === owner) - Number(a.short === owner));
  return [...legends, ...campaign.people.filter((p) => prompt.includes(p.short))];
}

/**
 * The reference images to attach for a photo, in order. The photo's own legend
 * and any person in it get all of theirs; other legends get their portrait only,
 * so a group shot stays within what image models accept (about 10 references).
 */
export function refsFor(item: ChecklistItem, campaign: Campaign) {
  const owner = OWNER.exec(item.label)?.[1];
  const refs = castIn(item, campaign).flatMap((c) =>
    (c.kind === "person" || c.short === owner ? c.refs : c.refs.slice(0, 1)).map((r) => ({ ...r, who: c.short as string | null })),
  );
  return isBranded(item) ? [...refs, ...LOGOS] : refs;
}

/**
 * One photo's prompt, ready to paste into an image model: the scene, then the
 * fixed description of everyone in it, the shared photo style, and the reference
 * images to attach with what each one is for.
 */
export function photoPrompt(item: ChecklistItem, doc: PhotosDoc, campaign: Campaign): string {
  const prompt = promptOf(item);
  if (!prompt) return "";
  const cast = castIn(item, campaign);
  const style = section(doc, "Photo style")?.body;
  const refs = refsFor(item, campaign);
  const vertical = /\bvertical\b/i.test(prompt);
  // The shared style describes a pro camera; the backstage phone snaps override it.
  const phone = /phone photo|shot on a phone/i.test(prompt);
  const cities = citiesIn(item);
  // Said outright, so a model never borrows a landmark from the other city.
  const location =
    cities.length === 1
      ? `Location: ${cities[0]}. Show only ${cities[0]}; nothing from any other city.`
      : cities.length === 0
        ? "Location: indoors or unspecified; no identifiable city, skyline or landmark."
        : null;
  // Opt-in: a photo whose scene doesn't place the logo is told outright to carry none,
  // or models put it on walls, screens and T-shirts.
  const branding = isBranded(item)
    ? "Branding: the Massive logo appears only where the scene places it, matching the attached logo images exactly, and nowhere else."
    : "Branding: none. No Massive logo or name anywhere in this photo; walls, screens, clothing and props carry no company logos or names.";

  return [
    prompt,
    location,
    branding,
    cast.length > 0 &&
      `Characters, matching the reference images exactly:\n${cast.map((c) => `- ${c.short}: ${c.look ?? c.title}`).join("\n")}`,
    style && `Photo style: ${style}`,
    phone && "This one is a phone snapshot: give it a phone camera's look, not the full-frame camera described above.",
    `Format: ${vertical ? "vertical 3:4" : "landscape 3:2"} photo.`,
    refs.length > 0 && `Reference images:\n${refs.map((r, i) => `${i + 1}. ${r.file}: ${r.use}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
