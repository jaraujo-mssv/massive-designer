import Papa from 'papaparse';
import { dominantSymbol, parseValue } from './value';

export interface BentoItem {
  id: string;
  name: string;
  logoUrl: string;
  value: number;
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
  items: BentoItem[];
  symbol: string;
  skipped: SkippedRow[];
  duplicateNames: string[];
}

export const COLUMNS = ['name', 'logo', 'value'] as const;

const HEADER_ALIASES: Record<string, (typeof COLUMNS)[number]> = {
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

type Row = Partial<Record<(typeof COLUMNS)[number], string>>;

/**
 * Parses a Bento Map sheet: optional `__TITLE__` / `__DATE__` rows, then a
 * header row with name / logo / value (aliases allowed), then one row per company.
 *
 * `delimiter` is omitted for .csv files so Papa can detect it; Google Sheets
 * exports and .tsv files pass "\t".
 */
export function parseSheet(text: string, delimiter?: string): ParsedSheet {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let title: string | undefined;
  let date: string | undefined;
  let metadataRows = 0;

  while (metadataRows < lines.length && lines[metadataRows].startsWith('__')) {
    const line = lines[metadataRows];
    const sep = delimiter ?? (line.includes('\t') ? '\t' : ',');
    const [key, ...rest] = line.split(sep);
    // Sheets pad metadata rows with empty cells ("Title\t\t"); drop those, then quotes.
    const value = rest.join(sep).replace(/[\t,\s]+$/, '').trim().replace(/^"(.*)"$/, '$1');
    if (key === '__TITLE__' && value) title = value;
    if (key === '__DATE__' && value) date = value;
    metadataRows++;
  }

  const result = Papa.parse<Row>(lines.slice(metadataRows).join('\n'), {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter,
    transformHeader: (h) => HEADER_ALIASES[h.trim().toLowerCase()] ?? h.trim().toLowerCase(),
  });

  const items: BentoItem[] = [];
  const symbols: (string | undefined)[] = [];
  const skipped: SkippedRow[] = [];
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  result.data.forEach((row, index) => {
    const rowNumber = metadataRows + index + 2;
    const name = row.name?.trim();
    const logoUrl = row.logo?.trim() ?? '';
    if (!name) {
      skipped.push({ row: rowNumber, reason: 'missing name' });
      return;
    }
    const parsed = parseValue(row.value);
    if (!parsed) {
      skipped.push({ row: rowNumber, reason: `${name}: value "${row.value ?? ''}" is not a positive number` });
      return;
    }
    const key = name.toLowerCase();
    if (seen.has(key)) duplicates.add(name);
    seen.add(key);

    symbols.push(parsed.symbol);
    items.push({ id: `bento-${index}-${key}`, name, logoUrl, value: parsed.value, approximate: parsed.approximate });
  });

  items.sort((a, b) => b.value - a.value);
  return { title, date, items, symbol: dominantSymbol(symbols), skipped, duplicateNames: [...duplicates] };
}
