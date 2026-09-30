import { textWidth } from '@/shared/canvas/measureText';

export const PILL_WEIGHT = 400;

/** A company pill's measurements at base font size `f` (the name's font size). */
export interface PillMetrics {
  fontSize: number;
  logo: number;
  padX: number;
  padY: number;
  /** Between the logo and the name. */
  innerGap: number;
  height: number;
  /** Between neighbouring pills, across and down. */
  gapX: number;
  gapY: number;
}

export function pillMetrics(f: number): PillMetrics {
  const logo = f * 1.4;
  const padY = f * 0.35;
  return {
    fontSize: f,
    logo,
    padX: f * 0.6,
    padY,
    innerGap: f * 0.45,
    // Logo height plus padding (pills have no border).
    height: logo + padY * 2,
    gapX: f * 0.45,
    gapY: f * 0.45,
  };
}

/** Pill width for `name`; `withLogo = false` for text-only pills ("+N more"). */
export function pillWidth(name: string, m: PillMetrics, withLogo = true): number {
  const logo = withLogo ? m.logo + m.innerGap : 0;
  return Math.ceil(m.padX * 2 + logo + textWidth(name, m.fontSize, PILL_WEIGHT));
}

export interface FlowResult {
  positions: { x: number; y: number }[];
  /** Height of the whole block of pill rows. */
  height: number;
  /** False when some pill is wider than the available width. */
  fits: boolean;
}

/**
 * Places pills left to right, wrapping to a new row when the row is full.
 * Each row is centred in `maxW`.
 */
export function flowPills(widths: number[], maxW: number, m: PillMetrics): FlowResult {
  const positions: { x: number; y: number }[] = [];
  let x = 0;
  let y = 0;
  let rowStart = 0;
  let fits = true;

  // Shifts the row that just ended so it sits in the middle of the width.
  const centreRow = (end: number) => {
    const rowW = x - m.gapX;
    const shift = Math.max(0, (maxW - rowW) / 2);
    for (let j = rowStart; j < end; j++) positions[j].x += shift;
  };

  widths.forEach((w, i) => {
    if (w > maxW) fits = false;
    if (i > 0 && x + w > maxW) {
      centreRow(i);
      rowStart = i;
      x = 0;
      y += m.height + m.gapY;
    }
    positions.push({ x, y });
    x += w + m.gapX;
  });
  if (widths.length > 0) centreRow(widths.length);
  return { positions, height: widths.length > 0 ? y + m.height : 0, fits };
}
