/** Always a split: these don't appear inside company names. */
const STRONG = [' · ', ' | ', ' — ', ' – '];
/** Only when spaced on both sides, so "Zeta-Labs" or "A/B Labs" stay whole. */
const SPACED = [' - ', ' / '];
/** What can follow a comma inside a company's own name ("Prescience, Inc."). */
const COMPANY_SUFFIX = /^(inc\.?|llc\.?|ltd\.?|corp\.?|co\.?|gmbh|s\.a\.?|plc\.?)$/i;

/**
 * Splits a sheet's company text into the name and a description, for names
 * written like "OpenRouter · Unified API for routing across AI models (2026)".
 *
 * Splits at the earliest " · ", " | ", " — " or " – " (so "Muse — App · Meta"
 * is "Muse" + "App · Meta"), else the earliest " - " or " / ", else ", ". A
 * comma only splits when what follows is at least two words and isn't a
 * company suffix, so "Vernius Systems, Inc." stays whole.
 */
export function splitName(text: string): { name: string; description?: string } {
  const whole = text.trim();

  for (const group of [STRONG, SPACED]) {
    const first = earliest(whole, group);
    if (first) return pair(whole.slice(0, first.index), whole.slice(first.index + first.sep.length), whole);
  }

  const comma = whole.indexOf(', ');
  if (comma > 0) {
    const rest = whole.slice(comma + 2).trim();
    const words = rest.split(/\s+/);
    if (words.length >= 2 && !COMPANY_SUFFIX.test(words[0])) return pair(whole.slice(0, comma), rest, whole);
  }
  return { name: whole };
}

/** The separator from `seps` that appears first in `text` (after its first character). */
function earliest(text: string, seps: string[]): { index: number; sep: string } | null {
  let best: { index: number; sep: string } | null = null;
  for (const sep of seps) {
    const index = text.indexOf(sep);
    if (index > 0 && (!best || index < best.index)) best = { index, sep };
  }
  return best;
}

function pair(name: string, description: string, whole: string) {
  const n = name.trim();
  const d = description.trim();
  if (!n) return { name: whole };
  return d ? { name: n, description: d } : { name: n };
}
