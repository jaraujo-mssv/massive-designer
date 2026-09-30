import { readSheetTable, SkippedRow } from '@/shared/canvas/sheetText';
import { splitName } from './splitName';
import { dominantSymbol, parseValue } from './value';

/**
 * `bento` sizes tiles by value (every company has a readable value); `grid`
 * shows equal tiles in rank order, with any values as labels.
 */
export type Layout = 'bento' | 'grid';

export interface ListItem {
  id: string;
  /** The name, without any description (see splitName). */
  name: string;
  /** Text after " · " and similar in the sheet's name, shown under the name. */
  description?: string;
  logoUrl: string;
  /** 1-based rank in the order shown. */
  rank: number;
  /** Bento only. */
  value?: number;
  /**
   * Value text to show as written: grid labels ("$7B+", "$50-100M", "$1.1B"), and
   * Bento values a rewritten number would misstate (open-ended, ranges).
   */
  valueLabel?: string;
  /** The sheet marked the value as an estimate ("~$361M"). */
  approximate: boolean;
}

export interface ParsedSheet {
  title?: string;
  date?: string;
  layout: Layout;
  items: ListItem[];
  symbol: string;
  skipped: SkippedRow[];
  duplicateNames: string[];
}

type Column = 'position' | 'name' | 'logo' | 'value';

const HEADER_ALIASES: Record<string, Column> = {
  position: 'position',
  rank: 'position',
  name: 'name',
  company: 'name',
  logo: 'logo',
  'logo url': 'logo',
  logo_url: 'logo',
  logourl: 'logo',
  value: 'value',
  valuation: 'value',
  'market cap': 'value',
  market_cap: 'value',
};

/**
 * Parses a Top List sheet. Metadata rows are handled by `readSheetTable`: only
 * the title and date are read, and sizing rows are ignored.
 *
 * Columns (aliases allowed): name and logo, plus optional position and value.
 * - When every company has a readable value, the layout is `bento`: tiles sized
 *   by value, largest first.
 * - Otherwise it's `grid`: ordered by position when given, else by row order,
 *   then ranked 1..N. Any value is kept as written, as a label.
 * Names are split into name and description at " · " and similar (splitName).
 */
export function parseSheet(text: string, delimiter?: string): ParsedSheet {
  const { title, date, fields, rows } = readSheetTable<Column>(text, HEADER_ALIASES, delimiter);

  // Bento sizes every tile by its value, so it needs one for every company.
  // Anything less (empty cells, unreadable text) is a ranked grid with labels.
  const named = rows.filter(({ row }) => row.name?.trim());
  const layout: Layout =
    fields.includes('value') && named.length > 0 && named.every(({ row }) => parseValue(row.value))
      ? 'bento'
      : 'grid';

  const items: ListItem[] = [];
  const symbols: (string | undefined)[] = [];
  const skipped: SkippedRow[] = [];
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  const positions = new Map<string, number>();

  rows.forEach(({ row, rowNumber }, index) => {
    const name = row.name?.trim();
    if (!name) {
      skipped.push({ row: rowNumber, reason: 'missing name' });
      return;
    }
    const id = `item-${index}-${name.toLowerCase()}`;
    const split = splitName(name);
    const item: ListItem = {
      id,
      name: split.name,
      description: split.description,
      logoUrl: row.logo?.trim() ?? '',
      rank: 0,
      approximate: false,
    };

    if (layout === 'bento') {
      const parsed = parseValue(row.value);
      if (!parsed) {
        skipped.push({ row: rowNumber, reason: `${name}: value "${row.value ?? ''}" is not a positive number` });
        return;
      }
      item.value = parsed.value;
      item.approximate = parsed.approximate;
      item.valueLabel = parsed.label;
      symbols.push(parsed.symbol);
    } else {
      item.valueLabel = row.value?.trim() || undefined;
      const position = parseFloat(row.position ?? '');
      // Rows without a position keep their sheet order, after the ranked ones.
      positions.set(id, Number.isFinite(position) ? position : 1e9 + index);
    }

    const key = split.name.toLowerCase();
    if (seen.has(key)) duplicates.add(split.name);
    seen.add(key);
    items.push(item);
  });

  if (layout === 'bento') {
    items.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  } else {
    // Array.prototype.sort is stable, so equal positions keep their sheet order.
    items.sort((a, b) => positions.get(a.id)! - positions.get(b.id)!);
  }
  items.forEach((item, i) => (item.rank = i + 1));

  return { title, date, layout, items, symbol: dominantSymbol(symbols), skipped, duplicateNames: [...duplicates] };
}
