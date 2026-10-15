import { toast } from "sonner";
import { htmlToText } from "../sheetText";

/** Google Sheets refuses cells longer than this. */
const SHEETS_CELL_LIMIT = 50000;

const clean = (cell: string) => cell.replace(/[\t\r\n]+/g, " ").trim();

/**
 * The tool's data as a sheet `readSheetTable` reads back: `__TITLE__` and
 * `__DATE__` rows, a blank line, then the header and one row per item.
 */
export function toSheetTsv({
  title,
  date,
  header,
  rows,
}: {
  /** Title and date as the canvas holds them (HTML). */
  title: string;
  date: string;
  header: string[];
  rows: string[][];
}): string {
  return [
    `__TITLE__\t${clean(htmlToText(title))}`,
    `__DATE__\t${clean(htmlToText(date))}`,
    "",
    header.join("\t"),
    ...rows.map((r) => r.map(clean).join("\t")),
  ].join("\n");
}

/** Names whose cells are too long to paste into Google Sheets (uploaded logos). */
function tooLongFor(rows: string[][], nameColumn: number): string[] {
  return rows.filter((r) => r.some((cell) => cell.length > SHEETS_CELL_LIMIT)).map((r) => r[nameColumn]);
}

function warnTooLong(rows: string[][], nameColumn: number) {
  const names = tooLongFor(rows, nameColumn);
  if (names.length > 0) {
    toast.warning(
      `Uploaded logos are too big for a Google Sheets cell: ${names.join(", ")}. Use a logo URL to keep them in a sheet.`,
    );
  }
}

export function downloadSheetTsv(fileName: string, tsv: string, rows: string[][], nameColumn: number) {
  const url = URL.createObjectURL(new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.tsv`;
  a.click();
  URL.revokeObjectURL(url);
  warnTooLong(rows, nameColumn);
}

/** Copies the TSV; pasted into Google Sheets, it fills the cells. */
export async function copySheetTsv(tsv: string, rows: string[][], nameColumn: number) {
  try {
    await navigator.clipboard.writeText(tsv);
    toast.success("Copied. Paste it into cell A1 of a Google Sheet.");
    warnTooLong(rows, nameColumn);
  } catch {
    toast.error("Couldn't copy to the clipboard. Use Download TSV instead.");
  }
}
