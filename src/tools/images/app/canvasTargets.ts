import type { ImageField } from "./types";

/** A box in the page's own pixels: the canvas's, since the page is the canvas's size and never scrolls. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Something on the image you can click to edit: a text field's words, or an image field's photo. */
export interface Target {
  field: ImageField;
  el: HTMLElement;
  box: Box;
}

/** A field with no text left still gets a box this wide, so it can be found and typed into. */
const MIN_TEXT_WIDTH = 24;
/** Clicks this close to a text still land on it: the box hugs the words. */
const HIT_SLOP = 8;

const toBox = (r: DOMRect): Box => ({ x: r.left, y: r.top, w: r.width, h: r.height });

function clip(b: Box, to: Box): Box | null {
  const x = Math.max(b.x, to.x);
  const y = Math.max(b.y, to.y);
  const w = Math.min(b.x + b.w, to.x + to.w) - x;
  const h = Math.min(b.y + b.h, to.y + to.h) - y;
  return w > 0 && h > 0 ? { x, y, w, h } : null;
}

/** Where an element shows on the canvas: around a text's words, or a photo's whole box. Null when it doesn't show. */
export function boxOf(el: HTMLElement, text: boolean): Box | null {
  const doc = el.ownerDocument;
  const canvas = doc.getElementById("canvas");
  if (!canvas || !el.isConnected || el.getClientRects().length === 0) return null;
  if (doc.defaultView?.getComputedStyle(el).visibility === "hidden") return null;
  let box = toBox(el.getBoundingClientRect());
  if (text) {
    const range = doc.createRange();
    range.selectNodeContents(el);
    const words = toBox(range.getBoundingClientRect());
    if (words.h > 0) box = words;
    if (box.w < MIN_TEXT_WIDTH) box = { ...box, x: box.x - (MIN_TEXT_WIDTH - box.w) / 2, w: MIN_TEXT_WIDTH };
  }
  return clip(box, toBox(canvas.getBoundingClientRect()));
}

/**
 * Every text and photo on the canvas that a field sets (`data-field` on a text field, `data-field-src` on an image
 * field) and that shows right now. Fields a page derives in onFields (chips, agendas…) have no element and stay in
 * the sidebar, as do toggles and selects.
 */
export function findTargets(doc: Document, fields: ImageField[]): Target[] {
  const canvas = doc.getElementById("canvas");
  if (!canvas) return [];
  const targets: Target[] = [];
  for (const el of canvas.querySelectorAll<HTMLElement>("[data-field], [data-field-src]")) {
    const text = el.dataset.field !== undefined;
    const id = text ? el.dataset.field : el.dataset.fieldSrc;
    const field = fields.find((f) => f.id === id && f.type === (text ? "text" : "image"));
    const box = field && boxOf(el, text);
    if (field && box) targets.push({ field, el, box });
  }
  return targets;
}

/**
 * The target under a point, by geometry rather than the page's own hit-testing: some pages set their text in
 * `pointer-events: none` layers. Text wins over a photo (photos are mostly backgrounds), then the smaller box.
 */
export function targetAt(targets: Target[], x: number, y: number): Target | null {
  const rank = (t: Target) => (t.field.type === "text" ? 0 : 1);
  const under = targets.filter(({ field, box: b }) => {
    const slop = field.type === "text" ? HIT_SLOP : 0;
    return x >= b.x - slop && x <= b.x + b.w + slop && y >= b.y - slop && y <= b.y + b.h + slop;
  });
  return under.sort((a, b) => rank(a) - rank(b) || a.box.w * a.box.h - b.box.w * b.box.h)[0] ?? null;
}
