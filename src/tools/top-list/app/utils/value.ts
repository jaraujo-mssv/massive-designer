const MULTIPLIERS: Record<string, number> = {
  k: 1e3,
  m: 1e6,
  b: 1e9,
  t: 1e12,
};

const CURRENCY_SYMBOLS = ['$', '€', '£', '¥'];

export interface ParsedValue {
  value: number;
  symbol?: string;
  /** Marked as an estimate in the sheet ("~$361M", "≈90M"). */
  approximate: boolean;
  /**
   * The sheet's own text, for values a rewritten number would misstate: open-ended
   * ("$7B+") and ranges ("$50-100M"). Undefined for plain values.
   */
  label?: string;
}

const NUMBER = '(\\d*\\.?\\d+)([kmbt])?';

/**
 * Reads a valuation as typed into a spreadsheet: a plain number
 * ("3650000000000", "$3,650,000,000,000") or shorthand ("4.2T", "91.5 B",
 * "€850M"), optionally marked as an estimate with a leading "~" or "≈".
 * Also open-ended ("$7B+", read as 7B) and ranges ("$50-100M", "50M–100M", read
 * as the midpoint, with a unit on either end applying to both); those keep their
 * text as `label`. Returns null when it isn't a positive number.
 */
export function parseValue(raw: string | undefined): ParsedValue | null {
  if (!raw) return null;
  const original = raw.trim();
  let text = original;
  const approximate = /^[~≈]/.test(text);
  text = text.replace(/^[~≈]\s*/, '');
  const symbol = CURRENCY_SYMBOLS.find((s) => text.includes(s));
  for (const s of CURRENCY_SYMBOLS) text = text.split(s).join('');
  text = text.replace(/[,\s]/g, '');

  const openEnded = text.endsWith('+');
  if (openEnded) text = text.slice(0, -1);

  const amount = (digits: string, unit: string | undefined) =>
    parseFloat(digits) * (unit ? MULTIPLIERS[unit.toLowerCase()] : 1);

  let value: number;
  let label: string | undefined;
  const range = text.match(new RegExp(`^${NUMBER}[-–—]${NUMBER}$`, 'i'));
  const single = text.match(new RegExp(`^${NUMBER}$`, 'i'));
  if (range) {
    // "50-100M": the unit on either end applies to both.
    const unit = range[2] ?? range[4];
    value = (amount(range[1], range[2] ?? unit) + amount(range[3], range[4] ?? unit)) / 2;
    label = original;
  } else if (single) {
    value = amount(single[1], single[2]);
    if (openEnded) label = original;
  } else {
    return null;
  }
  if (!Number.isFinite(value) || value <= 0) return null;
  return { value, symbol, approximate, label };
}

/**
 * 4_200_000_000_000 → "$4.2T"; one decimal below 100, none from 100 up.
 * Estimates keep their marker: "~$361M".
 */
export function formatValue(value: number, symbol = '$', approximate = false): string {
  const units: [number, string][] = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K'], [1, '']];
  let i = units.findIndex(([d]) => value >= d);
  if (i === -1) i = units.length - 1;
  let text = '';
  for (; i >= 0; i--) {
    const scaled = value / units[i][0];
    text = scaled.toFixed(scaled >= 100 ? 0 : 1).replace(/\.0$/, '');
    // 999.6B rounds to "1000" — roll up to "1T" instead.
    if (Number(text) < 1000 || i === 0) break;
  }
  return `${approximate ? '~' : ''}${symbol}${text}${units[Math.max(i, 0)][1]}`;
}

/** The symbol most rows use, so one "€" typo doesn't flip the whole map. */
export function dominantSymbol(symbols: (string | undefined)[]): string {
  const counts = new Map<string, number>();
  for (const s of symbols) if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
  let best = '$';
  let bestCount = 0;
  for (const [s, n] of counts) if (n > bestCount) [best, bestCount] = [s, n];
  return best;
}
