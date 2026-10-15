import type { Category, Company } from './parseSheet';

/**
 * Click-to-edit changes to a market map. Each returns a new array (layout is
 * memoised on it). A category is never left empty: removing its last company
 * removes it, since layout has nothing to place.
 */

const newId = (prefix: string) => `${prefix}-new-${crypto.randomUUID()}`;

export function findCompany(categories: Category[], companyId: string): { category: Category; company: Company } | null {
  for (const category of categories) {
    const company = category.companies.find((c) => c.id === companyId);
    if (company) return { category, company };
  }
  return null;
}

const dropEmpty = (categories: Category[]) => categories.filter((c) => c.companies.length > 0);

export function updateCompany(categories: Category[], companyId: string, patch: Partial<Pick<Company, 'name' | 'logoUrl'>>): Category[] {
  return categories.map((cat) =>
    cat.companies.some((c) => c.id === companyId)
      ? { ...cat, companies: cat.companies.map((c) => (c.id === companyId ? { ...c, ...patch } : c)) }
      : cat,
  );
}

export function deleteCompany(categories: Category[], companyId: string): Category[] {
  return dropEmpty(categories.map((cat) => ({ ...cat, companies: cat.companies.filter((c) => c.id !== companyId) })));
}

/** Moves a company to the end of another category. */
export function moveCompany(categories: Category[], companyId: string, toCategoryId: string): Category[] {
  const found = findCompany(categories, companyId);
  if (!found || found.category.id === toCategoryId) return categories;
  return dropEmpty(
    categories.map((cat) => {
      if (cat.id === found.category.id) return { ...cat, companies: cat.companies.filter((c) => c.id !== companyId) };
      if (cat.id === toCategoryId) return { ...cat, companies: [...cat.companies, found.company] };
      return cat;
    }),
  );
}

export function addCompany(categories: Category[], categoryId: string, company: Omit<Company, 'id'>): Category[] {
  return categories.map((cat) =>
    cat.id === categoryId ? { ...cat, companies: [...cat.companies, { ...company, id: newId('company') }] } : cat,
  );
}

export function renameCategory(categories: Category[], categoryId: string, name: string): Category[] {
  return categories.map((cat) => (cat.id === categoryId ? { ...cat, name } : cat));
}

export function deleteCategory(categories: Category[], categoryId: string): Category[] {
  return categories.filter((cat) => cat.id !== categoryId);
}

/** Adds a category at the end; it needs a first company. Returns the new category's id too. */
export function addCategory(categories: Category[], name: string, first: Omit<Company, 'id'>): { categories: Category[]; id: string } {
  const id = newId('category');
  return { categories: [...categories, { id, name, companies: [{ ...first, id: newId('company') }] }], id };
}

/** The category with this name (case-insensitive), if there is one. */
export function categoryNamed(categories: Category[], name: string): Category | undefined {
  const key = name.trim().toLowerCase();
  return categories.find((c) => c.name.toLowerCase() === key);
}
