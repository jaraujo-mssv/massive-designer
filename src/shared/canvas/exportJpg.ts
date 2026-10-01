import { domToJpeg } from 'modern-screenshot';
import { preloadImagesToDataUrls } from '@/shared/utils/imageDataUrl';
import { saveFile } from '@/shared/utils/saveFile';

/** Where an export is: converting logos, then rendering the image. */
export interface ExportProgress {
  step: 'logos' | 'render';
  done: number;
  total: number;
}

interface ExportJpgOptions {
  width: number;
  height: number;
  /** Theme background image, inlined so the export doesn't have to fetch it. */
  backgroundSrc?: string;
  /** File name without extension. Unsafe characters are replaced. */
  fileName: string;
  /** Called as the export moves along, so the UI can show it isn't stuck. */
  onProgress?: (progress: ExportProgress) => void;
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
 * Renders a canvas element to a 2x JPG and saves it (see saveFile). The element needs an
 * `id` so its clone can be told apart from its children's.
 *
 * Every <img> is converted to a data URL first (directly or through the image proxy), and
 * `fetchFn` only ever hands modern-screenshot a data URL. An external URL there
 * would taint the canvas and produce a silent black image.
 */
export async function exportCanvasJpg(element: HTMLElement, opts: ExportJpgOptions): Promise<void> {
  const imgs = Array.from(element.querySelectorAll<HTMLImageElement>('img'));
  // Usually quick: the tools warm this cache when a sheet loads (warmImageCache).
  const dataUrlMap = await preloadImagesToDataUrls(
    imgs.map((img) => img.src).filter(Boolean),
    (done, total) => opts.onProgress?.({ step: 'logos', done, total }),
  );
  opts.onProgress?.({ step: 'render', done: 0, total: 1 });

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
    progress: (done, total) => opts.onProgress?.({ step: 'render', done, total }),
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

  const blob = await fetch(dataUrl).then((r) => r.blob());
  await saveFile(blob, `${opts.fileName}.jpg`.replace(/[^a-z0-9\s\-_.]/gi, '_'));
}
