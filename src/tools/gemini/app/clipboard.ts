function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load the image"));
    img.src = src;
  });
}

export interface PngOptions {
  /** Draw the image this wide, centred on `ground` (the logos). */
  width?: number;
  /** The image's share of that width. */
  fill?: number;
  ground?: string;
  /** Otherwise: keep the image's own size, shrunk to fit this long side. */
  maxSide?: number;
}

/**
 * Any image as a PNG blob, since browsers only put `image/png` on the clipboard.
 * It goes through an `<img>` and a canvas rather than `createImageBitmap`, which
 * can't decode SVG (the logos).
 */
export async function toPng(src: string, opts: PngOptions = {}): Promise<Blob> {
  const img = await loadImage(src);
  const iw = img.naturalWidth || 1;
  const ih = img.naturalHeight || 1;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  if (opts.width) {
    const dw = Math.round(opts.width * (opts.fill ?? 1));
    const dh = Math.round((ih * dw) / iw);
    // A 2:1 frame, or taller when a tall image needs it, with the same margin all round.
    const margin = Math.round((opts.width - dw) / 2);
    canvas.width = opts.width;
    canvas.height = Math.max(Math.round(opts.width / 2), dh + 2 * margin);
    if (opts.ground) {
      ctx.fillStyle = opts.ground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, margin, Math.round((canvas.height - dh) / 2), dw, dh);
  } else {
    const scale = Math.min(1, (opts.maxSide ?? 2048) / Math.max(iw, ih));
    canvas.width = Math.round(iw * scale);
    canvas.height = Math.round(ih * scale);
    if (opts.ground) {
      ctx.fillStyle = opts.ground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode the image"))), "image/png"),
  );
}

/**
 * Puts an image itself (not its link) on the clipboard. The ClipboardItem gets a
 * promise rather than waiting for the PNG: Safari only allows the write inside the click.
 */
export async function copyImage(src: string | Promise<Blob>, opts?: PngOptions): Promise<void> {
  const png = typeof src === "string" ? toPng(src, opts) : src;
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
}

export const copyText = (text: string) => navigator.clipboard.writeText(text);

/** The first image on the clipboard, or null when there's none. Throws when the browser won't let the page read it. */
export async function readClipboardImage(): Promise<Blob | null> {
  for (const item of await navigator.clipboard.read()) {
    const type = item.types.find((t) => t.startsWith("image/"));
    if (type) return item.getType(type);
  }
  return null;
}

/** The image files in a paste or a drop. */
export const imageFiles = (data: DataTransfer | null): File[] =>
  Array.from(data?.files ?? []).filter((f) => f.type.startsWith("image/"));

export function imageSize(blob: Blob): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(blob);
  return loadImage(url)
    .then((img) => ({ width: img.naturalWidth, height: img.naturalHeight }))
    .catch(() => ({ width: 0, height: 0 }))
    .finally(() => URL.revokeObjectURL(url));
}
