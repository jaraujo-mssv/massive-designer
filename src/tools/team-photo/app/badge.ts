/**
 * The badge on a face: a red pill with a department in white, near the bottom and inside the circle
 * crop. It's drawn once, on a transparent canvas the size of a download, and the tiles and the
 * download both lay that same image over the face, so the preview and the JPG can't drift apart.
 */
export interface Badge {
  id: string;
  label: string;
}

export const BADGES: Badge[] = [
  { id: "ceo", label: "CEO" },
  { id: "engineering", label: "Engineering" },
  { id: "support", label: "Support" },
  { id: "operations", label: "Operations" },
  { id: "marketing", label: "Marketing" },
  { id: "finance", label: "Finance" },
  { id: "1p-supply", label: "1P Supply" },
  { id: "sales", label: "Sales" },
  { id: "product", label: "Product" },
  { id: "ambassador", label: "Ambassador" },
];

export const NONE = "none";
export const CUSTOM = "custom";
export type BadgeId = string;
export const BADGE_IDS: readonly BadgeId[] = [NONE, ...BADGES.map((b) => b.id), CUSTOM];
/** The longest custom badge, in characters. */
export const CUSTOM_MAX = 24;
/** What Custom says until it's edited, and again when picked blank. */
export const CUSTOM_DEFAULT = "Massive team";

/** The text to show, or null for no badge (None, or Custom left blank). */
export function badgeLabel(id: BadgeId, customText: string): string | null {
  if (id === CUSTOM) return customText.trim() || null;
  return BADGES.find((b) => b.id === id)?.label ?? null;
}

// In px of the 1080 px download.
const SIZE = 1080;
const FONT_SIZE = 50;
const WEIGHT = 700;
/** Labels' tracking (brand/BRAND.md, Type). */
const TRACKING = 0.08;
const PAD_X = 44;
const HEIGHT = 104;
/** The pill's centre, low on the face. */
const CENTER_Y = 905;
/** The widest pill that stays inside the circle crop at that height. */
const MAX_WIDTH = 640;
/** Paper-red: the light register's accent, since every ground is light. */
const FILL = "#d54635";
const TEXT = "#ffffff";

/** The badge as a transparent PNG data URL, SIZE px square. */
export async function renderBadge(label: string): Promise<string> {
  const font = (px: number) => `${WEIGHT} ${px}px Outfit`;
  await document.fonts.load(font(FONT_SIZE), label);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const text = label.toUpperCase();

  // Measured with its tracking, which canvas adds after the last letter too.
  const measure = (px: number) => {
    ctx.font = font(px);
    ctx.letterSpacing = `${TRACKING * px}px`;
    return ctx.measureText(text).width;
  };
  let px = FONT_SIZE;
  let width = measure(px);
  const room = MAX_WIDTH - 2 * PAD_X;
  if (width > room) {
    px = (FONT_SIZE * room) / width;
    width = measure(px);
  }
  // Browsers without canvas letter-spacing leave it out of the width.
  const spacing = ctx.letterSpacing ? TRACKING * px : 0;
  const inked = width - spacing;

  const pillWidth = inked + 2 * PAD_X;
  ctx.fillStyle = FILL;
  ctx.beginPath();
  ctx.roundRect(SIZE / 2 - pillWidth / 2, CENTER_Y - HEIGHT / 2, pillWidth, HEIGHT, HEIGHT / 2);
  ctx.fill();

  ctx.fillStyle = TEXT;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  // Outfit's capitals are 0.7 em tall: this baseline centres them in the pill.
  ctx.fillText(text, SIZE / 2 - inked / 2, CENTER_Y + px * 0.35);
  return canvas.toDataURL("image/png");
}
