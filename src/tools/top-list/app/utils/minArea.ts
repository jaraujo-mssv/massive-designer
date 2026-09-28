export interface SizedArea {
  area: number;
  /** True when the tile was enlarged to the minimum and is no longer to scale. */
  atMinimum: boolean;
}

/**
 * Splits `totalArea` between items in proportion to their values, except that
 * no tile gets less than `minSide²`.
 *
 * Water-filling: pin every tile that falls below the minimum, share what is
 * left between the rest by value, and repeat, since shrinking the rest can push
 * another tile under the line. Each pass pins at least one more tile, so it
 * finishes within `values.length` passes.
 *
 * If the minimums alone would take more than `maxMinShare` of the canvas, the
 * minimum is lowered so the large tiles still dominate.
 */
export function allocateAreas(
  values: number[],
  totalArea: number,
  minSide: number,
  maxMinShare = 0.5,
): SizedArea[] {
  const n = values.length;
  if (n === 0) return [];
  const minArea = Math.min(minSide * minSide, (totalArea * maxMinShare) / n);

  const pinned = new Array<boolean>(n).fill(false);
  const areas = new Array<number>(n).fill(0);

  for (let pass = 0; pass < n; pass++) {
    const pinnedCount = pinned.filter(Boolean).length;
    const freeArea = totalArea - pinnedCount * minArea;
    const freeValue = values.reduce((sum, v, i) => (pinned[i] ? sum : sum + v), 0);

    let newlyPinned = false;
    for (let i = 0; i < n; i++) {
      if (pinned[i]) {
        areas[i] = minArea;
        continue;
      }
      areas[i] = freeValue > 0 ? (values[i] / freeValue) * freeArea : minArea;
      if (areas[i] < minArea) {
        pinned[i] = true;
        newlyPinned = true;
      }
    }
    if (!newlyPinned) break;
  }

  return areas.map((area, i) => ({ area: pinned[i] ? minArea : area, atMinimum: pinned[i] }));
}
