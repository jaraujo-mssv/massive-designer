import { Layout, ListItem, orderItems } from './parseSheet';
import { parseValue } from './value';

/**
 * Click-to-edit changes to a top list. Each returns a new, re-ordered and
 * re-ranked array (see orderItems): in Bento a new value can move a tile.
 */

export interface ItemDraft {
  name: string;
  description: string;
  logoUrl: string;
  /** The value as typed; Bento needs a number, grid shows any text. */
  valueText: string;
}

/** The fields a value sets, or an error message when Bento can't read it. */
function valueFields(text: string, layout: Layout): Partial<ListItem> | string {
  const typed = text.trim();
  if (layout === 'grid') return { value: undefined, approximate: false, valueLabel: typed || undefined, valueText: typed || undefined };
  const parsed = parseValue(typed);
  if (!parsed) return 'Enter a positive number, like $1.2B, 850M or ~$361M.';
  return { value: parsed.value, approximate: parsed.approximate, valueLabel: parsed.label, valueText: typed };
}

/** The draft as item fields, or an error message. */
export function draftFields(draft: ItemDraft, layout: Layout): Partial<ListItem> | string {
  const name = draft.name.trim();
  if (!name) return 'A company needs a name.';
  const value = valueFields(draft.valueText, layout);
  if (typeof value === 'string') return value;
  return { ...value, name, description: draft.description.trim() || undefined, logoUrl: draft.logoUrl };
}

export function updateItem(items: ListItem[], id: string, fields: Partial<ListItem>, layout: Layout): ListItem[] {
  return orderItems(
    items.map((i) => (i.id === id ? { ...i, ...fields } : i)),
    layout,
  );
}

export function deleteItem(items: ListItem[], id: string, layout: Layout): ListItem[] {
  return orderItems(
    items.filter((i) => i.id !== id),
    layout,
  );
}

/** Grid only: moves an item to a 1-based rank (clamped). */
export function moveItem(items: ListItem[], id: string, rank: number, layout: Layout): ListItem[] {
  const from = items.findIndex((i) => i.id === id);
  if (from === -1) return items;
  const to = Math.min(items.length - 1, Math.max(0, Math.round(rank) - 1));
  if (from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return orderItems(next, layout);
}

/** Adds an item: by value in Bento, at `rank` (default last) in grid. */
export function addItem(items: ListItem[], fields: Partial<ListItem>, layout: Layout, rank?: number): ListItem[] {
  const item: ListItem = { id: `item-new-${crypto.randomUUID()}`, name: '', logoUrl: '', rank: 0, approximate: false, ...fields };
  const added = orderItems([...items, item], layout);
  return layout === 'grid' && rank !== undefined ? moveItem(added, item.id, rank, layout) : added;
}
