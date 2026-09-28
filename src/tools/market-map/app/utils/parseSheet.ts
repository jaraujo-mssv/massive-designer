import { readSheetTable, SkippedRow } from '@/shared/canvas/sheetText';

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
}

export interface Category {
  id: string;
  name: string;
  companies: Company[];
}

export interface ParsedSheet {
  title?: string;
  date?: string;
  categories: Category[];
  companyCount: number;
  skipped: SkippedRow[];
  duplicateNames: string[];
}

type Column = 'category' | 'name' | 'logo';

const HEADER_ALIASES: Record<string, Column> = {
  category: 'category',
  section: 'category',
  company: 'name',
  name: 'name',
  logo: 'logo',
  'logo url': 'logo',
  logo_url: 'logo',
  logourl: 'logo',
};

/**
 * Parses a Market Map sheet: one row per company, with its category, name and
 * logo. Metadata rows are handled by `readSheetTable`: only the title and date
 * are read, and sizing rows are ignored.
 *
 * Categories keep the order they first appear in, and companies keep sheet
 * order. Old-format extras are ignored: `url`, `stroke`, `subcompanies`,
 * `columnGap`, and category-only rows (a category with no company, which used
 * to carry per-category settings).
 */
export function parseSheet(text: string, delimiter?: string): ParsedSheet {
  const { title, date, rows } = readSheetTable<Column>(text, HEADER_ALIASES, delimiter);

  const categories = new Map<string, Category>();
  const skipped: SkippedRow[] = [];
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  let companyCount = 0;

  rows.forEach(({ row, rowNumber }, index) => {
    const categoryName = row.category?.trim();
    const name = row.name?.trim();
    if (!name) {
      // A category with no company is an old settings row; anything else is a real gap.
      if (!categoryName) skipped.push({ row: rowNumber, reason: 'missing company name' });
      return;
    }
    if (!categoryName) {
      skipped.push({ row: rowNumber, reason: `${name}: missing category` });
      return;
    }

    const key = categoryName.toLowerCase();
    if (!categories.has(key)) categories.set(key, { id: `category-${categories.size}-${key}`, name: categoryName, companies: [] });

    const nameKey = `${key}/${name.toLowerCase()}`;
    if (seen.has(nameKey)) duplicates.add(name);
    seen.add(nameKey);

    categories.get(key)!.companies.push({ id: `company-${index}`, name, logoUrl: row.logo?.trim() ?? '' });
    companyCount++;
  });

  return {
    title,
    date,
    categories: [...categories.values()],
    companyCount,
    skipped,
    duplicateNames: [...duplicates],
  };
}
