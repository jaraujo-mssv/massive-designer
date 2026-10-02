import type { Campaign, ChecklistItem, LegendDoc, PhotosDoc } from "../types";
import { section } from "./parseDoc";

/** `**Washington:** …` → "Washington". Items without one are group shots. */
export const OWNER = /^\*\*([^*]+):\*\*\s*/;

/** The item's `Prompt: …` line(s), without the label. */
/** What a reference shows, for its button: `washington-full.jpg` → "Full body". */
const KINDS: Record<string, string> = { new: "Portrait", face: "Face", full: "Full body", mask: "Mask", old: "Period" };
export const refLabel = (file: string) =>
  LOGOS.find((l) => l.file === file)?.label ?? KINDS[/-(\w+)\.\w+$/.exec(file)?.[1] ?? ""] ?? file;

export const promptOf = (item: ChecklistItem) => item.detail?.replace(/^Prompt:\s*/i, "").trim() || null;

/** Mentions of Massive branding that need the logo attached. */
const NEEDS_LOGO = /Massive logo|banner printed with the Massive/i;
/** The official logo, one version per background; the prompt says which goes where. */
export const LOGOS = [
  { file: "massive-logo-light-bg.png", label: "Logo, light", use: "the Massive logo for light surfaces such as a white backdrop or banner", who: null },
  { file: "massive-logo-dark-bg.png", label: "Logo, dark", use: "the Massive logo for dark surfaces such as charcoal walls", who: null },
];

/**
 * The legends a photo shows: its owner, or all of them for a group shot, unless
 * the prompt says they're out of frame (the audience shot). A legend's own photo
 * can still show another legend (Caesar beside Hercules): their names are matched too.
 */
export function legendsIn(item: ChecklistItem, campaign: Campaign): LegendDoc[] {
  const prompt = promptOf(item) ?? "";
  const owner = OWNER.exec(item.label)?.[1];
  if (!owner) return /legends are not in frame/i.test(prompt) ? [] : campaign.legends;
  return campaign.legends
    .filter((l) => l.short === owner || prompt.includes(l.short))
    .sort((a, b) => Number(b.short === owner) - Number(a.short === owner));
}

/**
 * The reference images to attach for a photo, in order. The photo's own legend
 * gets all of theirs; anyone else in frame gets their portrait only, so a group
 * shot stays within what image models accept (about 10 references).
 */
export function refsFor(item: ChecklistItem, campaign: Campaign) {
  const owner = OWNER.exec(item.label)?.[1];
  const refs = legendsIn(item, campaign).flatMap((l) =>
    (l.short === owner ? l.refs : l.refs.slice(0, 1)).map((r) => ({ ...r, who: l.short as string | null })),
  );
  return NEEDS_LOGO.test(promptOf(item) ?? "") ? [...refs, ...LOGOS] : refs;
}

/**
 * One photo's prompt, ready to paste into an image model: the scene, then each
 * legend's fixed description, the shared photo style, and the reference images
 * to attach with what each one is for.
 */
export function photoPrompt(item: ChecklistItem, doc: PhotosDoc, campaign: Campaign): string {
  const prompt = promptOf(item);
  if (!prompt) return "";
  const legends = legendsIn(item, campaign);
  const style = section(doc, "Photo style")?.body;
  const refs = refsFor(item, campaign);
  const vertical = /\bvertical\b/i.test(prompt);
  // The shared style describes a pro camera; the backstage phone snaps override it.
  const phone = /phone photo|shot on a phone/i.test(prompt);

  return [
    prompt,
    legends.length > 0 &&
      `Characters, matching the reference images exactly:\n${legends.map((l) => `- ${l.short}: ${l.look ?? l.title}`).join("\n")}`,
    style && `Photo style: ${style}`,
    phone && "This one is a phone snapshot: give it a phone camera's look, not the full-frame camera described above.",
    `Format: ${vertical ? "vertical 3:4" : "landscape 3:2"} photo.`,
    refs.length > 0 && `Reference images:\n${refs.map((r, i) => `${i + 1}. ${r.file}: ${r.use}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
