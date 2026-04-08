import { useState, useEffect } from 'react';

// Cache to store converted data URLs
const imageCache = new Map<string, string>();

/**
 * Fetches an image through the Vite dev/preview server proxy (no CORS restrictions),
 * draws it to a canvas, and returns a data URL. Falls back to the original URL on error.
 */
async function loadAsDataUrl(url: string): Promise<string> {
  // Pass through data URLs unchanged
  if (url.startsWith('data:')) return url;

  // Check cache
  if (imageCache.has(url)) return imageCache.get(url)!;

  const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // proxy always returns Access-Control-Allow-Origin: *

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // SVGs without explicit dimensions have naturalWidth/Height = 0; fall back to 256px
        canvas.width = img.naturalWidth || 256;
        canvas.height = img.naturalHeight || 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(url); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        // Don't cache empty results — let the next render retry
        if (dataUrl && dataUrl !== 'data:,') {
          imageCache.set(url, dataUrl);
        }
        resolve(dataUrl && dataUrl !== 'data:,' ? dataUrl : url);
      } catch {
        resolve(url);
      }
    };

    img.onerror = () => resolve(url);
    img.src = proxyUrl;
  });
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
 * Batch-converts an array of image URLs to data URLs via the local proxy.
 * Returns a map of original URL → data URL (or original URL on failure).
 */
export async function preloadImagesToDataUrls(urls: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  await Promise.all(
    [...new Set(urls)].filter(Boolean).map(async (url) => {
      results.set(url, await loadAsDataUrl(url));
    })
  );
  return results;
}
