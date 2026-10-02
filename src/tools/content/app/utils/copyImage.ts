/** Converts any image to a PNG blob: browsers only put `image/png` on the clipboard. */
async function toPng(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  const bitmap = await createImageBitmap(await res.blob());
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode the image"))), "image/png"),
  );
}

/**
 * Copies an image itself (not its link) to the clipboard, ready to paste into an
 * image tool. The ClipboardItem is created straight away with a promise rather
 * than after the fetch: Safari only allows the write inside the click.
 */
export async function copyImage(url: string): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": toPng(url) })]);
}
