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
}

/**
 * Reads a valuation as typed into a spreadsheet: a plain number
 * ("3650000000000", "$3,650,000,000,000") or shorthand ("4.2T", "91.5 B",
 * "€850M"), optionally marked as an estimate with a leading "~" or "≈".
 * Returns null when it isn't a positive number.
 */
export function parseValue(raw: string | undefined): ParsedValue | null {
  if (!raw) return null;
  let text = raw.trim();
  const approximate = /^[~≈]/.test(text);
  text = text.replace(/^[~≈]\s*/, '');
  const symbol = CURRENCY_SYMBOLS.find((s) => text.includes(s));
  for (const s of CURRENCY_SYMBOLS) text = text.split(s).join('');
  text = text.replace(/[,\s]/g, '');

  const match = text.match(/^(\d*\.?\d+)([kmbt])?$/i);
  if (!match) return null;
  const value = parseFloat(match[1]) * (match[2] ? MULTIPLIERS[match[2].toLowerCase()] : 1);
  if (!Number.isFinite(value) || value <= 0) return null;
  return { value, symbol, approximate };
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
