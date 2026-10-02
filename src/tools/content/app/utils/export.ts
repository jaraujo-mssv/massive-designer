import { domToBlob } from "modern-screenshot";
import { saveFile } from "@/shared/utils/saveFile";

/**
 * Saves a frame as a PNG at its true size.
 *
 * The preview is the real 1080×1920 (or 1920×1080) node scaled down by a CSS
 * transform. The clone is rendered with `transform: none`; without it the PNG
 * comes out the size of the preview, sitting in a full-size canvas.
 */
export async function exportFrame(node: HTMLElement | null, w: number, h: number, fileName: string): Promise<void> {
  if (!node) throw new Error("Nothing to export");
  // Fonts must be settled or the export bakes in fallback type.
  await document.fonts.ready;
  const blob = await domToBlob(node, {
    width: w,
    height: h,
    style: { transform: "none", transformOrigin: "unset" },
    type: "image/png",
  });
  if (!blob) throw new Error("The renderer returned no image");
  await saveFile(blob, fileName);
}
