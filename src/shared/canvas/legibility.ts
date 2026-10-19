/**
 * Minimum text sizes for images posted to social feeds, set by how big text
 * ends up on a phone rather than on the canvas. A feed shows an image about
 * PHONE_FEED_WIDTH points wide, so a 1080-wide canvas is seen at about ⅓ and a
 * 1920-wide one at about 0.19: the same pixel size reads much smaller on the
 * wider canvas.
 */

/** Points a feed image spans on a phone (LinkedIn, Instagram, X). */
export const PHONE_FEED_WIDTH = 360;
/** Names: the text people read first. */
export const PRIMARY_MIN_PT = 10;
/** Descriptions, values, rank numbers. */
export const SECONDARY_MIN_PT = 8;

/** Minimum text sizes in canvas pixels for a canvas this wide. */
export interface LegibleSizes {
  primary: number;
  secondary: number;
}

export function legibleSizes(canvasWidth: number): LegibleSizes {
  const pxPerPt = canvasWidth / PHONE_FEED_WIDTH;
  return { primary: PRIMARY_MIN_PT * pxPerPt, secondary: SECONDARY_MIN_PT * pxPerPt };
}

/** How big `px` of canvas text appears on a phone, in points. */
export function phonePt(px: number, canvasWidth: number): number {
  return (px * PHONE_FEED_WIDTH) / canvasWidth;
}
