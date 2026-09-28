export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Worst (largest) aspect ratio in a row of areas laid along a side of length `side`. */
function worstRatio(row: number[], side: number): number {
  const sum = row.reduce((a, b) => a + b, 0);
  const max = Math.max(...row);
  const min = Math.min(...row);
  const s2 = side * side;
  const sum2 = sum * sum;
  return Math.max((s2 * max) / sum2, sum2 / (s2 * min));
}

/**
 * Squarified treemap (Bruls, Huizing & van Wijk, 2000).
 *
 * `areas` must be sorted largest first and sum to the rect's area. Tiles are laid
 * in rows along the shorter side of the space that is left; a tile joins the
 * current row as long as that makes the row's worst aspect ratio no worse.
 * Returns one rect per area, in the same order.
 */
export function squarify(areas: number[], bounds: Rect): Rect[] {
  const rects: Rect[] = [];
  let free = { ...bounds };
  let i = 0;

  while (i < areas.length) {
    const side = Math.min(free.w, free.h);
    const row = [areas[i]];
    let j = i + 1;
    while (j < areas.length && worstRatio([...row, areas[j]], side) <= worstRatio(row, side)) {
      row.push(areas[j]);
      j++;
    }

    const rowArea = row.reduce((a, b) => a + b, 0);
    if (free.w >= free.h) {
      // Short side is the height: lay the row as a column on the left.
      const colW = free.h > 0 ? rowArea / free.h : 0;
      let y = free.y;
      for (const a of row) {
        const h = colW > 0 ? a / colW : 0;
        rects.push({ x: free.x, y, w: colW, h });
        y += h;
      }
      free = { x: free.x + colW, y: free.y, w: free.w - colW, h: free.h };
    } else {
      // Short side is the width: lay the row across the top.
      const rowH = free.w > 0 ? rowArea / free.w : 0;
      let x = free.x;
      for (const a of row) {
        const w = rowH > 0 ? a / rowH : 0;
        rects.push({ x, y: free.y, w, h: rowH });
        x += w;
      }
      free = { x: free.x, y: free.y + rowH, w: free.w, h: free.h - rowH };
    }
    i = j;
  }

  return rects;
}

/**
 * Opens a `gap` between neighbouring tiles and snaps edges to whole pixels.
 * Snapping each edge (not each width) means two tiles that share an edge in the
 * layout still share it exactly, so the export has no hairline seams or overlaps.
 */
export function insetAndSnap(rects: Rect[], gap: number): Rect[] {
  const half = gap / 2;
  return rects.map((r) => {
    const x0 = Math.round(r.x + half);
    const y0 = Math.round(r.y + half);
    const x1 = Math.round(r.x + r.w - half);
    const y1 = Math.round(r.y + r.h - half);
    return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
  });
}
