import Papa from 'papaparse';

export interface SkippedRow {
  /** 1-based row number as seen in the spreadsheet, header included. */
  row: number;
  reason: string;
}

export interface SheetRow<Column extends string> {
  row: Partial<Record<Column, string>>;
  /** 1-based row number as seen in the spreadsheet. */
  rowNumber: number;
}

export interface SheetTable<Column extends string> {
  title?: string;
  date?: string;
  /** Header fields after aliasing. */
  fields: string[];
  /** Non-empty data rows, in sheet order. */
  rows: SheetRow<Column>[];
}

/**
 * Reads a sheet exported by the canvas tools' spreadsheets.
 *
 * Only `__TITLE__` and `__DATE__` are read from the metadata rows. Every other
 * `__` row (`__COLUMNS__`, `__SETTING__…`) is dropped wherever it appears:
 * sizing is always automatic, whatever the sheet says. Blank lines before the
 * header are skipped, and headers are matched case-insensitively through
 * `aliases` (unknown headers are kept, lowercased).
 *
 * `delimiter` is omitted for .csv files so Papa can detect it; Google Sheets
 * exports and .tsv files pass "\t".
 */
export function readSheetTable<Column extends string>(
  text: string,
  aliases: Record<string, Column>,
  delimiter?: string,
): SheetTable<Column> {
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

  const result = Papa.parse<Partial<Record<Column, string>>>(data.map((d) => d.line).join('\n'), {
    header: true,
    skipEmptyLines: false,
    delimiter,
    transformHeader: (h) => aliases[h.trim().toLowerCase()] ?? h.trim().toLowerCase(),
  });

  // Papa's data rows follow the header one-for-one because empty lines are kept.
  const rows = result.data
    .map((row, i) => ({ row, rowNumber: data[i + 1]?.row ?? headerRow + i + 1 }))
    .filter(({ row }) => Object.values(row).some((v) => typeof v === 'string' && v.trim()));

  return { title, date, fields: result.meta.fields ?? [], rows };
}

/** Plain sheet text → HTML safe to put in a contentEditable title. */
export function escapeHtml(text: string): string {
  const el = document.createElement('div');
  el.textContent = text;
  return el.innerHTML;
}

/** Title HTML → plain text, for file names. */
export function htmlToText(html: string): string {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent || '';
}
