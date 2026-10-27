import { proxyUrl } from "@/shared/utils/imageDataUrl";
import { MAX_UPLOAD_EDGE } from "./constants";

/** What the Photo field says about a file that isn't an image. */
export const NOT_AN_IMAGE = "That file isn't an image.";

/** Read an uploaded image and scale it down to a JPEG data URL, small enough to keep in localStorage. */
export async function readImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(NOT_AN_IMAGE);
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(NOT_AN_IMAGE);
  });
  const k = Math.min(1, MAX_UPLOAD_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * k);
  canvas.height = Math.round(bitmap.height * k);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * Whether a photo link loads, through the image proxy (as the preview and the export will load it):
 * public hosts only, images only, and readable whatever the host's own rules for other sites.
 */
export function checkPhoto(url: string): Promise<boolean> {
  return new Promise((done) => {
    const img = new Image();
    const timer = setTimeout(() => done(false), 20_000);
    img.onload = () => {
      clearTimeout(timer);
      done(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      done(false);
    };
    img.src = proxyUrl(url);
  });
}

/** The first file in a paste or a drop, if it is a file at all. */
export const fileIn = (data: DataTransfer | null) =>
  data?.files?.[0] ?? Array.from(data?.items ?? []).find((i) => i.kind === "file")?.getAsFile() ?? null;

/** Whether a paste or drop carries an image file (and not just text). */
export const hasImageFile = (data: DataTransfer | null) =>
  Array.from(data?.items ?? []).some((i) => i.kind === "file" && i.type.startsWith("image/"));
