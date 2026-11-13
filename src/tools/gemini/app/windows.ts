/**
 * Opening Gemini in tiled windows.
 *
 * Gemini can't be shown inside this page (it sends `X-Frame-Options: DENY`), and
 * once a Gemini window loads, the browser cuts its link back to this one
 * (`Cross-Origin-Opener-Policy: same-origin-allow-popups`). So each window's
 * size and place is set when it opens, and after that it's on its own: it can't
 * be focused, moved or closed from here.
 */
export type Arrangement = "columns" | "grid";

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** `window.open` sizes the page, not the window: a pop-up adds its title and address bars. */
const FRAME_HEIGHT = 62;
/** Below this share of the screen, the free side is too narrow and the windows take the whole screen. */
const MIN_SHARE = 0.4;

type ScreenWithOffset = Screen & { availLeft?: number; availTop?: number };

export interface ScreenLayout {
  screen: Rect;
  /** Where this window is, on that screen. */
  self: Rect;
  /** Where the Gemini windows go: the side of the screen this window leaves free. */
  area: Rect;
  /** True when this window leaves too little room, so the Gemini windows cover the screen. */
  full: boolean;
}

export function screenLayout(): ScreenLayout {
  const s = window.screen as ScreenWithOffset;
  const screen = { left: s.availLeft ?? 0, top: s.availTop ?? 0, width: s.availWidth, height: s.availHeight };
  const self = { left: window.screenX, top: window.screenY, width: window.outerWidth, height: window.outerHeight };
  const leftRoom = Math.max(0, self.left - screen.left);
  const rightRoom = Math.max(0, screen.left + screen.width - (self.left + self.width));
  if (Math.max(leftRoom, rightRoom) < screen.width * MIN_SHARE) return { screen, self, area: screen, full: true };
  const area =
    rightRoom >= leftRoom
      ? { left: self.left + self.width, top: screen.top, width: rightRoom, height: screen.height }
      : { left: screen.left, top: screen.top, width: leftRoom, height: screen.height };
  return { screen, self, area, full: false };
}

/** The area cut into `count` windows: side by side, or two rows. */
export function tiles(count: number, arrangement: Arrangement, area: Rect): Rect[] {
  const rows = arrangement === "grid" && count > 1 ? 2 : 1;
  const cols = Math.ceil(count / rows);
  const width = Math.floor(area.width / cols);
  const height = Math.floor(area.height / rows);
  return Array.from({ length: count }, (_, i) => ({
    left: area.left + (i % cols) * width,
    top: area.top + Math.floor(i / cols) * height,
    width,
    height,
  }));
}

/** A new chat, in the given Google account (0 is the first one signed in). */
export const geminiUrl = (account: number) =>
  account > 0 ? `https://gemini.google.com/u/${account}/app` : "https://gemini.google.com/app";

/** Opens one window; false when the browser blocked it. */
export function openWindow(url: string, rect: Rect): boolean {
  const features = [
    "popup=yes",
    `left=${Math.round(rect.left)}`,
    `top=${Math.round(rect.top)}`,
    `width=${Math.round(rect.width)}`,
    `height=${Math.max(200, Math.round(rect.height - FRAME_HEIGHT))}`,
  ].join(",");
  return window.open(url, "_blank", features) !== null;
}
