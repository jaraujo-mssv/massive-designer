/**
 * How a non-square image becomes square:
 * - `crop`: a square part of it (chosen on the image), scaled to the output size
 * - `fit`: the whole image, scaled to fit and centred, with transparent padding
 */
export type SquareMode = 'crop' | 'fit';

/** A square area of the image, in percent of its width and height (react-image-crop's PercentCrop). */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Google Sheets refuses cells longer than this, so longer data URLs can't go in a sheet. */
export const SHEETS_CELL_LIMIT = 50_000;

/** The image's pixel size. SVGs without a size report 0, so they're drawn at 256px. */
export function naturalSize(img: HTMLImageElement): { width: number; height: number } {
  return { width: img.naturalWidth || 256, height: img.naturalHeight || 256 };
}

/** The crop area in the image's own pixels. */
export function cropPixels(img: HTMLImageElement, area: CropArea) {
  const { width, height } = naturalSize(img);
  return {
    x: (area.x / 100) * width,
    y: (area.y / 100) * height,
    width: (area.width / 100) * width,
    height: (area.height / 100) * height,
  };
}

/**
 * Draws `img` into a `side` × `side` PNG and returns it as a data URL. Never
 * stretches: Crop draws a square area, Fit keeps the whole image's proportions.
 * Without an area, Crop uses the largest centred square.
 */
export function encodeSquare(img: HTMLImageElement, mode: SquareMode, area: CropArea | null, side: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const { width, height } = naturalSize(img);
  if (mode === 'fit') {
    const scale = side / Math.max(width, height);
    const w = width * scale;
    const h = height * scale;
    ctx.drawImage(img, (side - w) / 2, (side - h) / 2, w, h);
  } else {
    const shortSide = Math.min(width, height);
    const src = area
      ? cropPixels(img, area)
      : { x: (width - shortSide) / 2, y: (height - shortSide) / 2, width: shortSide, height: shortSide };
    ctx.drawImage(img, src.x, src.y, src.width, src.height, 0, 0, side, side);
  }
  return canvas.toDataURL('image/png');
}

/** Pixels the output is drawn from, along one side; less than the output side means upscaling. */
export function sourceSide(img: HTMLImageElement, mode: SquareMode, area: CropArea | null): number {
  const { width, height } = naturalSize(img);
  if (mode === 'fit') return Math.max(width, height);
  if (!area) return Math.min(width, height);
  const px = cropPixels(img, area);
  return Math.min(px.width, px.height);
}

/** Copies text, with the old execCommand route for browsers that block the Clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Falls through to execCommand.
    }
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}

/**
 * A readable name from an image URL: a `domain=` parameter (favicon services),
 * else the last path segment without its extension ("img.logo.dev/stripe.com" → "stripe").
 */
export function nameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const domain = parsed.searchParams.get('domain');
    if (domain) return domain;
    const last = parsed.pathname.split('/').filter(Boolean).pop() ?? '';
    return decodeURIComponent(last).replace(/\.[^.]+$/, '') || parsed.hostname;
  } catch {
    return 'image';
  }
}
