let ctx: CanvasRenderingContext2D | null = null;

function context(): CanvasRenderingContext2D | null {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  return ctx;
}

export function textWidth(text: string, fontSize: number, fontWeight: number): number {
  const c = context();
  if (!c) return text.length * fontSize * 0.55;
  c.font = `${fontWeight} ${fontSize}px Outfit, sans-serif`;
  return c.measureText(text).width;
}

/**
 * The longest version of `text` that fits in `maxWidth` on one line, with an
 * ellipsis when cut. Returns null when fewer than `minChars` would survive — a
 * name cut down to "Mi…" says nothing, so the tile drops it instead.
 *
 * Measured with canvas `measureText`, not the DOM, so fitting every tile costs
 * no layout passes. Only accurate once Outfit has loaded (see document.fonts).
 */
export function fitText(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontWeight: number,
  minChars = 4,
): string | null {
  if (textWidth(text, fontSize, fontWeight) <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (textWidth(`${text.slice(0, mid).trimEnd()}…`, fontSize, fontWeight) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo >= minChars ? `${text.slice(0, lo).trimEnd()}…` : null;
}

/**
 * Splits `text` into two lines at the word break that balances them best, so
 * a long name reads in full instead of being cut. Returns null when there's no
 * word break, or no break that makes both lines fit in `maxWidth`.
 */
export function wrapTwoLines(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontWeight: number,
): [string, string] | null {
  const words = text.split(/\s+/).filter(Boolean);
  let best: [string, string] | null = null;
  let bestWidest = Infinity;
  for (let i = 1; i < words.length; i++) {
    const first = words.slice(0, i).join(' ');
    const second = words.slice(i).join(' ');
    const widest = Math.max(textWidth(first, fontSize, fontWeight), textWidth(second, fontSize, fontWeight));
    if (widest <= maxWidth && widest < bestWidest) {
      best = [first, second];
      bestWidest = widest;
    }
  }
  return best;
}
