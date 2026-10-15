import { Column } from "../App";

/**
 * Reassigns every company.position to 1..N in column-major reading order
 * (straight down column 0, then column 1, etc.).
 *
 * Does NOT reorder companies — it only rewrites `position` to match their
 * current physical order. Returns new column/company objects (immutable) so
 * React state updates correctly.
 */
export function renumberColumns(columns: Column[]): Column[] {
  let counter = 0;
  return columns.map((column) => ({
    ...column,
    companies: column.companies.map((company) => ({
      ...company,
      position: ++counter,
    })),
  }));
}
