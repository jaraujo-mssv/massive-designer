/** Strongest overlay a tile can get; the weakest is none. */
export const MAX_TINT = 0.07;

/**
 * A per-tile overlay opacity in [0, MAX_TINT], so tiles vary slightly in shade
 * instead of all sharing one flat colour.
 *
 * Looks random but is derived from the company name (FNV-1a hash), so a map
 * renders identically every time, in the preview and in the exported JPG, and
 * a company keeps its shade when other rows are added or reordered.
 */
export function tileTint(name: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return ((hash >>> 0) / 0xffffffff) * MAX_TINT;
}
