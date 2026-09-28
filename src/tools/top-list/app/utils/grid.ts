import type { Rect } from './squarify';

/**
 * Equal tiles in a near-square grid: ceil(√n) columns (2×2, 3×3, 4×4…) and as
 * many rows as needed. When the last row isn't full, its tiles stretch to fill
 * it, so 10 items read 4 + 4 + 2 with the bottom two tiles twice as wide.
 *
 * Tiles are returned in reading order (left to right, top to bottom), the same
 * Rect shape as `squarify`, so both go through `insetAndSnap`.
 */
export function gridRects(n: number, bounds: Rect): Rect[] {
  if (n <= 0) return [];
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const rowH = bounds.h / rows;

  const rects: Rect[] = [];
  for (let r = 0; r < rows; r++) {
    const inRow = r === rows - 1 ? n - cols * (rows - 1) : cols;
    const tileW = bounds.w / inRow;
    for (let c = 0; c < inRow; c++) {
      rects.push({ x: bounds.x + c * tileW, y: bounds.y + r * rowH, w: tileW, h: rowH });
    }
  }
  return rects;
}
