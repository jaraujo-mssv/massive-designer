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

/** Greedy word wrap at `maxWidth`; null if a single word is wider than that. */
function greedyLines(words: string[], maxWidth: number, fontSize: number, fontWeight: number): string[] | null {
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (textWidth(word, fontSize, fontWeight) > maxWidth) return null;
    const candidate = line ? `${line} ${word}` : word;
    if (line && textWidth(candidate, fontSize, fontWeight) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Wraps `text` at word breaks into as few lines as fit in `maxWidth` (at most
 * `maxLines`), then balances them: the lines are made as even as possible
 * without adding a line. Returns null when it can't fit in `maxLines`.
 */
export function wrapLines(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontWeight: number,
  maxLines: number,
): string[] | null {
  const words = text.split(/\s+/).filter(Boolean);
  const loose = greedyLines(words, maxWidth, fontSize, fontWeight);
  if (!loose || loose.length > maxLines) return null;
  if (loose.length === 1) return loose;

  // Narrow the width as far as possible while keeping the same number of lines.
  let lo = Math.max(...words.map((w) => textWidth(w, fontSize, fontWeight)));
  let hi = maxWidth;
  let best = loose;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const lines = greedyLines(words, mid, fontSize, fontWeight);
    if (lines && lines.length === loose.length) {
      best = lines;
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return best;
}
