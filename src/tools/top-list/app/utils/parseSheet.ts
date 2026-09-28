import Papa from 'papaparse';
import { dominantSymbol, parseValue } from './value';

/**
 * `bento` sizes tiles by value (the sheet has a value column); `grid` shows
 * equal tiles in rank order.
 */
export type Layout = 'bento' | 'grid';

export interface ListItem {
  id: string;
  name: string;
  logoUrl: string;
  /** 1-based rank in the order shown. */
  rank: number;
  /** Bento only. */
  value?: number;
  /** The sheet marked the value as an estimate ("~$361M"). */
  approximate: boolean;
}

export interface SkippedRow {
  /** 1-based row number as seen in the spreadsheet, header included. */
  row: number;
  reason: string;
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

type Row = Partial<Record<Column, string>>;

/**
 * Parses a Top List sheet.
 *
 * Only `__TITLE__` and `__DATE__` are read from the metadata rows. Every other
 * `__` row (`__COLUMNS__`, `__SETTING__…`) is dropped wherever it appears:
 * sizing is always automatic, whatever the sheet says.
 *
 * Columns (aliases allowed): name and logo, plus optional position and value.
 * - With a value column that has at least one valid value, the layout is
 *   `bento`: tiles sized by value, largest first. Rows without a valid value
 *   are skipped.
 * - Otherwise it's `grid`: ordered by position when given, else by row order,
 *   then ranked 1..N.
 *
 * `delimiter` is omitted for .csv files so Papa can detect it; Google Sheets
 * exports and .tsv files pass "\t".
 */
export function parseSheet(text: string, delimiter?: string): ParsedSheet {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let title: string | undefined;
  let date: string | undefined;

  // Keep each data line's sheet row number so skipped-row messages stay accurate.
  const data: { line: string; row: number }[] = [];
  lines.forEach((line, i) => {
    if (!line.startsWith('__')) {
      data.push({ line, row: i + 1 });
      return;
    }
    const sep = delimiter ?? (line.includes('\t') ? '\t' : ',');
    const [key, ...rest] = line.split(sep);
    // Sheets pad metadata rows with empty cells ("Title\t\t"); drop those, then quotes.
    const value = rest.join(sep).replace(/[\t,\s]+$/, '').trim().replace(/^"(.*)"$/, '$1');
    if (key === '__TITLE__' && value) title = value;
    if (key === '__DATE__' && value) date = value;
  });
  while (data.length > 0 && !data[0].line.trim()) data.shift();
  const headerRow = data[0]?.row ?? 1;

  const result = Papa.parse<Row>(data.map((d) => d.line).join('\n'), {
    header: true,
    skipEmptyLines: false,
    delimiter,
    transformHeader: (h) => HEADER_ALIASES[h.trim().toLowerCase()] ?? h.trim().toLowerCase(),
  });

  // Papa's data rows follow the header one-for-one because empty lines are kept.
  const rows = result.data
    .map((row, i) => ({ row, rowNumber: data[i + 1]?.row ?? headerRow + i + 1 }))
    .filter(({ row }) => Object.values(row).some((v) => v?.trim()));

  const hasValueColumn = result.meta.fields?.includes('value') ?? false;
  const layout: Layout =
    hasValueColumn && rows.some(({ row }) => row.name?.trim() && parseValue(row.value)) ? 'bento' : 'grid';

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
    const item: ListItem = { id, name, logoUrl: row.logo?.trim() ?? '', rank: 0, approximate: false };

    if (layout === 'bento') {
      const parsed = parseValue(row.value);
      if (!parsed) {
        skipped.push({ row: rowNumber, reason: `${name}: value "${row.value ?? ''}" is not a positive number` });
        return;
      }
      item.value = parsed.value;
      item.approximate = parsed.approximate;
      symbols.push(parsed.symbol);
    } else {
      const position = parseFloat(row.position ?? '');
      // Rows without a position keep their sheet order, after the ranked ones.
      positions.set(id, Number.isFinite(position) ? position : 1e9 + index);
    }

    const key = name.toLowerCase();
    if (seen.has(key)) duplicates.add(name);
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
