import { domToJpeg } from 'modern-screenshot';
import { preloadImagesToDataUrls } from '@/shared/utils/imageDataUrl';

interface ExportJpgOptions {
  width: number;
  height: number;
  /** Theme background image, inlined so the export doesn't have to fetch it. */
  backgroundSrc?: string;
  /** File name without extension. Unsafe characters are replaced. */
  fileName: string;
}

async function blobUrlToDataUrl(src: string): Promise<string> {
  const blob = await fetch(src).then((r) => r.blob());
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Renders a canvas element to a 2x JPG and downloads it. The element needs an
 * `id` so its clone can be told apart from its children's.
 *
 * Every <img> is converted to a data URL first (through the image proxy), and
 * `fetchFn` only ever hands modern-screenshot a data URL. An external URL there
 * would taint the canvas and produce a silent black image.
 */
export async function exportCanvasJpg(element: HTMLElement, opts: ExportJpgOptions): Promise<void> {
  const imgs = Array.from(element.querySelectorAll<HTMLImageElement>('img'));
  const dataUrlMap = await preloadImagesToDataUrls(imgs.map((img) => img.src).filter(Boolean));

  let bgDataUrl = '';
  if (opts.backgroundSrc) {
    try {
      bgDataUrl = await blobUrlToDataUrl(opts.backgroundSrc);
    } catch {
      /* non-fatal: export proceeds without the background image */
    }
  }

  const dataUrl = await domToJpeg(element, {
    quality: 0.95,
    scale: 2,
    width: opts.width,
    height: opts.height,
    style: { transform: 'none' },
    onCloneNode: (cloned: Node) => {
      if (!(cloned instanceof HTMLElement)) return;
      if (bgDataUrl && element.id && cloned.id === element.id) {
        cloned.style.backgroundImage = `url(${bgDataUrl})`;
      }
      cloned.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
        const cached = dataUrlMap.get(img.src);
        if (cached?.startsWith('data:')) img.src = cached;
      });
    },
    fetchFn: async (url: string) => {
      const cached = dataUrlMap.get(url);
      return cached?.startsWith('data:') ? cached : false;
    },
  });

  const link = document.createElement('a');
  link.download = `${opts.fileName}.jpg`.replace(/[^a-z0-9\s\-_.]/gi, '_');
  link.href = dataUrl;
  link.click();
}
