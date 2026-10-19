import type { Campaign, ChecklistItem, LegendDoc, PersonDoc, PhotosDoc, PlaceDoc } from "../types";
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

/**
 * A campaign's photos docs, the backstage one (photos.md) first: a campaign can
 * have others with their own style, like portraits.md.
 */
export const photoDocsOf = (campaign: Campaign) =>
  campaign.docs
    .filter((d): d is PhotosDoc => d.kind === "photos")
    .sort((a, b) => Number(b.id === "photos") - Number(a.id === "photos"));

/** The photo's image prompt. */
export const promptOf = (item: ChecklistItem) => fieldOf(item, "Prompt");
/** The generated photo, a file in `public/content/<campaign>/photos/`, once there is one. */
export const imageOf = (item: ChecklistItem) => fieldOf(item, "Image");
/** The photo's aspect ratio: portrait when its prompt says vertical, landscape otherwise. */
export const aspectOf = (item: ChecklistItem) => (/\bvertical\b/i.test(promptOf(item) ?? "") ? "3:4" : "3:2");

/**
 * The official brand images: the wordmark logo, one version per background, for
 * a scene that places the logo (the backdrop, a banner, the reception wall), the
 * icon on its own for one that places the Massive icon (a lapel pin), and the
 * "It's Massive" merch tops (T-shirt, tank top, racerback) for one that dresses
 * someone in one. Each goes only to a prompt that matches it; every other photo is
 * told to show none. `mark` is what the branding line calls it, and `note` anything
 * that line adds.
 */
const WORDMARK = /Massive logo|banner printed with the Massive/i;
const PRINT = "\"IT'S MASSIVE\" in bold black italic capitals made of halftone dots over the orange halftone mountain";
const merchNote = (top: string) =>
  `Where the scene dresses someone in the Massive ${top}, it replaces the top their description gives them, and fits them as the scene says.`;
export const LOGOS = [
  { file: "massive-logo-light-bg.webp", label: "Logo, light", mark: "logo", use: "the Massive logo for light surfaces such as a white backdrop or banner", who: null, match: WORDMARK },
  { file: "massive-logo-dark-bg.webp", label: "Logo, dark", mark: "logo", use: "the Massive logo for dark surfaces such as charcoal walls", who: null, match: WORDMARK },
  { file: "massive-icon.webp", label: "Icon", mark: "icon", use: "the Massive icon, the orange mountain mark on its own, for the lapel pin", who: null, match: /Massive icon/i },
  {
    file: "massive-tee.webp",
    label: "T-shirt",
    mark: "T-shirt",
    use: `the It's Massive merch T-shirt: match its off-white cotton, crew neck, and the print exactly, ${PRINT}; ignore the hanger, the wall and its loose, flat fit`,
    note: merchNote("T-shirt"),
    who: null,
    match: /Massive T-shirt/i,
  },
  {
    file: "massive-tank.webp",
    label: "Tank top",
    mark: "tank top",
    use: `the It's Massive merch tank top: match its off-white cotton, sleeveless cut with deep armholes, crew neck, and the print exactly, ${PRINT}; ignore the hanger, the wall and its loose, flat fit`,
    note: merchNote("tank top"),
    who: null,
    match: /Massive tank top/i,
  },
  {
    file: "massive-racerback.webp",
    label: "Racerback",
    mark: "racerback tank",
    use: `the It's Massive merch racerback tank: match its white cotton, scoop neck, racerback straps, and the print exactly, ${PRINT}; ignore the hanger, the wall and its loose, flat fit`,
    note: merchNote("racerback tank"),
    who: null,
    match: /Massive racerback/i,
  },
];
/** The brand images a piece of text calls for. */
export const logosFor = (text: string | null) => LOGOS.filter((l) => l.match.test(text ?? ""));
/** Whether a photo shows Massive branding: only when its scene places the logo or the icon. */
export const isBranded = (item: ChecklistItem) => logosFor(promptOf(item)).length > 0;

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

/** What a reference shows, for its button: `washington-full.webp` → "Full body". */
const KINDS: Record<string, string> = {
  new: "Portrait",
  face: "Face",
  full: "Full body",
  torso: "Torso",
  turnaround: "Turnaround",
  mask: "Mask",
  old: "Period",
  icon: "Icon",
};
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
 * Gemini 3 Pro Image takes up to 14 images in one generation, and holds the
 * likeness of people across up to 5 of them; past that, faces drift and blend.
 */
const MAX_REFS = 14;
const MAX_PEOPLE_REFS = 5;

/**
 * The recurring place a photo is set in, if any: the place whose `match` phrase
 * appears in the prompt, the longest phrase winning, so "Massive's office lounge"
 * is the lounge rather than the office.
 */
export function placeIn(item: ChecklistItem, campaign: Campaign): PlaceDoc | null {
  const prompt = (promptOf(item) ?? "").toLowerCase();
  let best: { place: PlaceDoc; length: number } | null = null;
  for (const place of campaign.places)
    for (const phrase of place.match)
      if (prompt.includes(phrase.toLowerCase()) && phrase.length > (best?.length ?? 0)) best = { place, length: phrase.length };
  return best?.place ?? null;
}

/**
 * The reference images to attach for a photo, in order: each person's together,
 * in cast order, then the place's when it's set in one, then the logos when the
 * scene places one. Within the 5 images
 * of people, everyone in frame gets their first (their portrait), then the
 * photo's own character gets the rest of theirs, then the others get more of
 * theirs in cast order.
 */
export function refsFor(item: ChecklistItem, campaign: Campaign) {
  const owner = OWNER.exec(item.label)?.[1];
  const cast = castIn(item, campaign);
  const priority = [
    ...cast.map((c) => c.refs[0]),
    ...cast.filter((c) => c.short === owner).flatMap((c) => c.refs.slice(1)),
    ...cast.filter((c) => c.short !== owner).flatMap((c) => c.refs.slice(1)),
  ].filter(Boolean);
  const picked = new Set(priority.slice(0, MAX_PEOPLE_REFS));
  const people = cast.flatMap((c) =>
    c.refs.filter((r) => picked.has(r)).map((r) => ({ ...r, who: c.short as string | null, kind: "person" as RefKind })),
  );
  const place = placeIn(item, campaign);
  const places = (place?.refs ?? []).map((r) => ({ ...r, who: place!.short as string | null, kind: "place" as RefKind }));
  const logos = logosFor(promptOf(item)).map((l) => ({ ...l, kind: "logo" as RefKind }));
  return [...people, ...places, ...logos].slice(0, MAX_REFS);
}

type RefKind = "person" | "place" | "logo";

/** A reference image as the prompt numbers it: "Image 3, John Cena, face". */
export interface PhotoRef {
  file: string;
  use: string;
  who: string | null;
  kind: RefKind;
  /** 1-based, the order the images are attached in. */
  n: number;
  /** "Michael Jordan, face", "Press room, the place" or "Massive logo, light". */
  label: string;
}

/** "images 1–2" or "image 5": the references that show one person or place. */
const imagesOf = (refs: PhotoRef[], who: string) => {
  const ns = refs.filter((r) => r.who === who).map((r) => r.n);
  if (ns.length === 0) return null;
  return ns.length === 1 ? `image ${ns[0]}` : `images ${ns[0]}–${ns[ns.length - 1]}`;
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The name and description for one character's line. A look that already opens
 * with the name ("Jason Grad, Massive's CEO: a man in his thirties…") keeps that
 * opening as the name, so it isn't said twice.
 */
function characterLine(c: LegendDoc | PersonDoc, refs: PhotoRef[]) {
  const look = c.look ?? c.title;
  const named = new RegExp(`^(${escapeRegExp(c.short)}[^:]{0,60}):\\s*`).exec(look);
  const images = imagesOf(refs, c.short);
  return `- ${named ? named[1] : c.short}${images ? ` (${images})` : ""}: ${named ? look.slice(named[0].length) : look}`;
}

/**
 * The shared photo style, minus what doesn't apply here: a paragraph opening
 * `Indoors:` goes only into indoor photos (no city named), one opening
 * `Outdoors:` only into photos set in a city. Untagged paragraphs always go in.
 */
function styleFor(doc: PhotosDoc, outdoors: boolean) {
  const body = section(doc, "Photo style")?.body;
  if (!body) return null;
  return body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => {
      const tag = /^(Indoors|Outdoors):/i.exec(p)?.[1].toLowerCase();
      return p && (!tag || (tag === "outdoors") === outdoors);
    })
    .join(" ");
}

/** Every company but Massive, said once, with the props real brands turn up on. */
const NO_OTHER_BRANDS =
  "No other company's logos, brand names or readable signs; balls, hoops, sports gear, cars and devices are plain and unmarked.";

const LABEL: Record<RefKind, (r: { file: string; who: string | null }) => string> = {
  person: (r) => `${r.who}, ${refLabel(r.file).toLowerCase()}`,
  place: (r) => `${r.who}, the place`,
  logo: (r) => `Massive ${refLabel(r.file).toLowerCase()}`,
};

function build(item: ChecklistItem, doc: PhotosDoc, campaign: Campaign, withFiles: boolean) {
  const prompt = promptOf(item);
  if (!prompt) return null;
  const cast = castIn(item, campaign);
  const refs: PhotoRef[] = refsFor(item, campaign).map((r, i) => ({
    file: r.file,
    use: r.use,
    who: r.who,
    kind: r.kind,
    n: i + 1,
    label: LABEL[r.kind](r),
  }));
  const place = placeIn(item, campaign);
  const placeImages = place && imagesOf(refs, place.short);
  const cities = citiesIn(item);
  const style = styleFor(doc, cities.length > 0);
  const aspect = aspectOf(item);
  const phone = /phone photo|shot on a phone/i.test(prompt);
  // Said outright, so a model never borrows a landmark from the other city.
  const location =
    cities.length === 1
      ? `Location: ${cities[0]}, shown as itself: its real streets, light and landmarks, and nothing from any other city.`
      : cities.length === 0
        ? "Location: indoors, in no identifiable city."
        : null;
  // Opt-in: a photo whose scene doesn't place the logo is told outright to carry none,
  // or models put it on walls, screens and T-shirts.
  const brand = logosFor(prompt);
  // Whatever the scene places: the full logo (a backdrop), the icon (a lapel pin), the merch T-shirt.
  const marks = [...new Set(brand.map((l) => l.mark))];
  const notes = brand.flatMap((l) => ("note" in l ? [l.note] : []));
  const branding =
    brand.length > 0
      ? [
          `Branding: ${marks.map((m) => `the Massive ${m}`).join(" and ")} ${marks.length > 1 ? "appear" : "appears"} only where the scene places ${marks.length > 1 ? "them" : "it"}, matching the attached ${marks.join(" and ")} image${brand.length > 1 ? "s" : ""} exactly, and nowhere else.`,
          ...notes,
          NO_OTHER_BRANDS,
        ].join(" ")
      : `Branding: no Massive logo or name anywhere in this photo, including walls, screens and clothing. ${NO_OTHER_BRANDS}`;
  const people = refs.some((r) => r.kind === "person");

  const text = [
    prompt,
    location,
    branding,
    cast.length > 0 && `Characters, matching their reference images:\n${cast.map((c) => characterLine(c, refs)).join("\n")}`,
    // The place's image is an empty shot from one angle: same room, the scene's own framing.
    place &&
      `Place: ${place.title}${placeImages ? ` (${placeImages})` : ""}. ${place.look ?? ""} Keep it exactly as in its reference image: the same layout, walls, floor, furniture, windows, colours and light. The reference shows it empty and from one angle; fill it and frame it as the scene describes.`.replace(
        /\s+/g,
        " ",
      ),
    style &&
      [
        `Photo style: ${style}`,
        // The style is the house look; a scene that asks for a 135mm, deep focus or a pose gets it.
        "Where the scene above gives a lens, distance, framing, focus, pose or light, follow the scene; the style is only the default.",
        phone && "This one is a phone snapshot: give it a phone camera's look, not a full-frame camera's.",
      ]
        .filter(Boolean)
        .join(" "),
    `Format: ${aspect === "3:4" ? "vertical" : "landscape"} ${aspect} photo.`,
    refs.length > 0 &&
      [
        people &&
          `Use the images of people only for who each person is: face, head, build, skin and hair. Don't copy their clothes, poses, backgrounds or lighting; clothes come from ${notes.length ? "the scene first, then" : ""} the descriptions above.`.replace("  ", " "),
        `Reference images, in the order attached:\n${refs.map((r) => `Image ${r.n}, ${r.label}${withFiles ? ` [${r.file}]` : ""}: ${r.use}`).join("\n")}`,
      ]
        .filter(Boolean)
        .join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
  return { text, refs };
}

/**
 * One photo's request for an image model: the prompt, and the reference images
 * to attach in that order. The prompt numbers the images and ties each person to
 * theirs, and the CLI labels each image with its number as it attaches it.
 */
export const photoRequest = (item: ChecklistItem, doc: PhotosDoc, campaign: Campaign) => build(item, doc, campaign, false);

/**
 * One photo's prompt, ready to paste into an image model: the same as
 * photoRequest(), with each reference's file name so it matches its copy button.
 */
export const photoPrompt = (item: ChecklistItem, doc: PhotosDoc, campaign: Campaign): string =>
  build(item, doc, campaign, true)?.text ?? "";

/** A place's reference image: landscape 3:2 unless its doc says otherwise. */
export const placeAspect = (place: PlaceDoc) => place.aspect ?? "3:2";
/** Whether a place's description includes the Massive logo (the press room backdrop), so its image gets the logos. */
export const placeBranded = (place: PlaceDoc) => logosFor(place.look).length > 0;

/**
 * The prompt for a place's own reference image: the place, empty and sharp from
 * front to back from the angle its doc gives, so photos set there can match it.
 */
export function placePrompt(place: PlaceDoc): string {
  const aspect = placeAspect(place);
  const branded = placeBranded(place);
  return [
    `A location reference photo for a photo shoot, with nobody in it. ${place.look ?? place.title}${place.shot ? ` Seen ${place.shot}.` : ""}`,
    [
      "Wide establishing shot from standing eye level, 24mm, deep focus so every surface is sharp from front to back, soft even light, true-to-life colours, photorealistic.",
      "Completely empty: no people, no hands, no reflections of people.",
      branded
        ? "The Massive logo appears only where described, matching the attached logo images exactly. No other text, logos, brand names or readable signs beyond what's described;"
        : "No text, logos, brand names or readable signs beyond what's described;",
      "all furniture, gear and devices are plain and unmarked.",
      `Format: ${aspect === "3:4" ? "vertical" : "landscape"} ${aspect} photo.`,
    ].join(" "),
    branded &&
      `Reference images, in the order attached:\n${logosFor(place.look)
        .map((l, i) => `Image ${i + 1}, Massive ${refLabel(l.file).toLowerCase()}: ${l.use}`)
        .join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
