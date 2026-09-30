import { useState, useEffect } from 'react';

// Converted data URLs, by original URL.
const imageCache = new Map<string, string>();
// Conversions in progress, so the same image is never fetched twice at once
// (e.g. the background warm-up and an export asking together).
const inFlight = new Map<string, Promise<string>>();
// Per host: can its images be read directly (it sends CORS headers)? The first
// image from a host finds out; the others wait for that answer.
const hostAllowsCors = new Map<string, Promise<boolean>>();

const proxyUrl = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;

function hostOf(url: string): string | null {
  try {
    return new URL(url, window.location.href).host;
  } catch {
    return null;
  }
}

/** Loads `src` with CORS and draws it to a canvas; null if that isn't allowed or fails. */
function drawToDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // SVGs without explicit dimensions have naturalWidth/Height = 0; fall back to 256px
        canvas.width = img.naturalWidth || 256;
        canvas.height = img.naturalHeight || 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl && dataUrl !== 'data:,' ? dataUrl : null);
      } catch {
        // A canvas tainted by a non-CORS image refuses toDataURL().
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function convert(url: string): Promise<string | null> {
  // Direct first: hosts that send CORS headers (logo.dev does) load in parallel
  // over HTTP/2, far faster than one proxy round trip per image.
  const host = hostOf(url);
  if (host) {
    const known = hostAllowsCors.get(host);
    if (!known) {
      const direct = drawToDataUrl(url);
      hostAllowsCors.set(host, direct.then((r) => r !== null));
      const result = await direct;
      if (result) return result;
    } else if (await known) {
      const result = await drawToDataUrl(url);
      if (result) return result;
    }
  }
  // Otherwise through the image proxy (Vite dev/preview middleware, or
  // api/image-proxy on Vercel), which always answers with CORS headers.
  return drawToDataUrl(proxyUrl(url));
}

/**
 * Converts an image URL to a data URL: loaded directly when its host allows
 * CORS, otherwise through the image proxy, then drawn to a canvas. Falls back
 * to the original URL on error. Results are cached for the session.
 *
 * Exported because a data URL is a hard requirement for anything that reads the
 * pixels back — a cross-origin texture upload throws SECURITY_ERR in WebGL, and
 * a tainted 2D canvas will not give up `toDataURL()`.
 */
export function loadAsDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return Promise.resolve(url);
  const cached = imageCache.get(url);
  if (cached) return Promise.resolve(cached);
  const running = inFlight.get(url);
  if (running) return running;

  const promise = convert(url)
    .then((dataUrl) => {
      // Don't cache failures — let the next request retry.
      if (dataUrl) imageCache.set(url, dataUrl);
      return dataUrl ?? url;
    })
    .finally(() => inFlight.delete(url));
  inFlight.set(url, promise);
  return promise;
}

/**
 * React hook: converts an external image URL to a data URL via the local proxy.
 * Returns the original URL immediately and updates once conversion completes.
 */
export function useImageToDataUrl(url: string | undefined): string {
  const [dataUrl, setDataUrl] = useState<string>(url || '');

  useEffect(() => {
    if (!url) { setDataUrl(''); return; }
    if (imageCache.has(url)) { setDataUrl(imageCache.get(url)!); return; }

    setDataUrl(url); // show original immediately while converting
    loadAsDataUrl(url).then(setDataUrl);
  }, [url]);

  return dataUrl;
}

/**
 * Batch-converts image URLs to data URLs (see `loadAsDataUrl`). Returns a map of
 * original URL → data URL (or original URL on failure). `onProgress` is called
 * as each unique image finishes.
 */
export async function preloadImagesToDataUrls(
  urls: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const unique = [...new Set(urls)].filter(Boolean);
  let done = 0;
  onProgress?.(0, unique.length);
  await Promise.all(
    unique.map(async (url) => {
      results.set(url, await loadAsDataUrl(url));
      onProgress?.(++done, unique.length);
    })
  );
  return results;
}

/**
 * Starts converting images in the background so a later export finds them
 * ready. Safe to call repeatedly: cached and in-flight images aren't refetched.
 */
export function warmImageCache(urls: string[]): void {
  // Absolute, as <img>.src reports them, so the export's lookups hit the cache.
  const absolute = urls
    .filter((u) => u && !u.startsWith('data:'))
    .map((u) => {
      try {
        return new URL(u, window.location.href).href;
      } catch {
        return u;
      }
    });
  void preloadImagesToDataUrls(absolute);
}
