import { loadAsDataUrl } from '@/shared/utils/imageDataUrl';
import { createRenderer } from './live/renderer';
import type { LivePreset } from './types';

/**
 * Bakes a single dithered frame to a PNG data URL.
 *
 * Everything in this app exports through `modern-screenshot`'s `domToBlob`,
 * which snapshots the DOM. A live WebGL canvas does not survive that, so the
 * templates hold a plain `<img>` and this module is what fills it.
 *
 * The frame is deterministic: `render(0)` with no pointer means the trail is
 * empty, drift is zero and `noiseZ` is `floor(speed * 0)`, so the same source
 * and preset always produce the same bytes. That is what lets the result be
 * cached, and what makes the preview honest about the export.
 */

/**
 * Longest edge of the baked bitmap, matching the blog's `DitherImage`. Cells
 * are `preset.scale` pixels here and get scaled up by the browser with
 * `image-rendering: pixelated`, so capping costs sharpness nowhere and saves a
 * 1080×1350 texture upload on every re-render.
 */
const MAX_EDGE = 1400;

export interface DitherBox {
  width: number;
  height: number;
}

/** Keyed on everything that changes the pixels. */
const cache = new Map<string, string>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('dither: source image failed to load'));
    img.src = src;
  });
}

/**
 * Crops the source to the box's aspect ratio, `cover`-style, into a 2D canvas.
 *
 * The renderer stretches its source across the whole target with no aspect
 * fitting of its own, so the crop has to happen before the texture upload —
 * otherwise a portrait photo in a landscape box comes out squashed, with
 * squashed dither cells to match.
 */
function coverCrop(img: HTMLImageElement, box: DitherBox): HTMLCanvasElement {
  const fit = Math.min(1, MAX_EDGE / Math.max(box.width, box.height));
  const width = Math.max(1, Math.round(box.width * fit));
  const height = Math.max(1, Math.round(box.height * fit));

  const sourceWidth = img.naturalWidth || img.width;
  const sourceHeight = img.naturalHeight || img.height;
  if (!sourceWidth || !sourceHeight) throw new Error('dither: source has no dimensions');

  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('dither: no 2D context');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  return canvas;
}

/**
 * Resolves `sourceUrl` to a dithered PNG data URL sized for `box`.
 *
 * Never rejects: if WebGL2 is missing, the shaders fail to compile, or the
 * source cannot be decoded, the undithered image comes back instead. A social
 * post with a plain photograph is a worse post; a social post with an empty box
 * is a broken one.
 */
export async function renderDitheredDataUrl(
  sourceUrl: string,
  preset: LivePreset,
  box: DitherBox,
): Promise<string> {
  if (!sourceUrl) return '';

  const key = `${sourceUrl}|${JSON.stringify(preset)}|${box.width}x${box.height}`;
  const cached = cache.get(key);
  if (cached) return cached;

  // Through the proxy first, always: a cross-origin texture upload throws
  // SECURITY_ERR, and every image the Social Media tool gets is remote.
  const dataUrl = await loadAsDataUrl(sourceUrl);

  let renderer: ReturnType<typeof createRenderer> | null = null;
  try {
    const img = await loadImage(dataUrl);
    const crop = coverCrop(img, box);

    const gl = document.createElement('canvas');
    gl.width = crop.width;
    gl.height = crop.height;

    let failure: Error | null = null;
    renderer = createRenderer(gl, {
      preset,
      // The bake reads the buffer back after the draw, which is exactly the
      // case the default (discard on submit) breaks.
      preserveDrawingBuffer: true,
      onError: (error) => {
        failure = error;
      },
    });
    renderer.setSource(crop);
    renderer.render(0);
    if (failure) throw failure;

    const result = gl.toDataURL('image/png');
    if (!result || result === 'data:,') throw new Error('dither: empty draw');

    cache.set(key, result);
    return result;
  } catch {
    // Cached too — a source that cannot be dithered will not start being able to.
    cache.set(key, dataUrl);
    return dataUrl;
  } finally {
    renderer?.destroy();
  }
}
