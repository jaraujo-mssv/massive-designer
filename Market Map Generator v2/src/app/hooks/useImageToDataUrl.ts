import { useState, useEffect } from 'react';

// Cache to store converted data URLs
const imageCache = new Map<string, string>();

/**
 * Converts an external image URL to a data URL to avoid CORS issues during export
 * Returns the original URL if conversion fails
 */
export function useImageToDataUrl(url: string | undefined): string {
  const [dataUrl, setDataUrl] = useState<string>(url || '');

  useEffect(() => {
    if (!url) {
      setDataUrl('');
      return;
    }

    // If already a data URL, return as-is
    if (url.startsWith('data:')) {
      setDataUrl(url);
      return;
    }

    // Check cache first
    if (imageCache.has(url)) {
      setDataUrl(imageCache.get(url)!);
      return;
    }

    // Convert to data URL
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Try to request CORS
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const convertedDataUrl = canvas.toDataURL('image/png');
            imageCache.set(url, convertedDataUrl);
            setDataUrl(convertedDataUrl);
          } catch (error) {
            // If toDataURL fails due to taint, fall back to original URL
            console.warn('Failed to convert image to data URL:', url);
            setDataUrl(url);
          }
        } else {
          setDataUrl(url);
        }
      } catch (error) {
        console.warn('Error converting image:', url, error);
        setDataUrl(url);
      }
    };

    img.onerror = () => {
      // If image fails to load, use original URL anyway
      setDataUrl(url);
    };

    img.src = url;
  }, [url]);

  return dataUrl;
}

/**
 * Preload and convert an array of image URLs to data URLs
 * Returns a promise that resolves when all conversions are complete
 */
export async function preloadImagesToDataUrls(urls: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  const promises = urls.map(async (url) => {
    if (!url || url.startsWith('data:')) {
      results.set(url, url);
      return;
    }

    // Check cache
    if (imageCache.has(url)) {
      results.set(url, imageCache.get(url)!);
      return;
    }

    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            try {
              const dataUrl = canvas.toDataURL('image/png');
              imageCache.set(url, dataUrl);
              results.set(url, dataUrl);
            } catch (error) {
              results.set(url, url);
            }
          } else {
            results.set(url, url);
          }
        } catch (error) {
          results.set(url, url);
        }
        resolve();
      };

      img.onerror = () => {
        results.set(url, url);
        resolve();
      };

      img.src = url;
    });
  });

  await Promise.all(promises);
  return results;
}
