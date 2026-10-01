/** Phones and tablets: a coarse pointer and no hover. */
function isTouchDevice(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse) and (hover: none)").matches;
}

/**
 * Saves a generated file.
 *
 * On phones it opens the share sheet first ("Save Image" puts it in Photos on
 * iOS). That needs a recent tap, which a long export can outlast, so it falls
 * back to a normal download. Desktop always downloads. A blob URL is used for
 * the download because iOS opens `data:` links in a tab instead of saving them.
 */
export async function saveFile(blob: Blob, fileName: string): Promise<void> {
  if (isTouchDevice() && typeof navigator.canShare === "function") {
    const file = new File([blob], fileName, { type: blob.type });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (err) {
        // Closing the share sheet isn't a failure; anything else falls back to a download.
        if ((err as Error).name === "AbortError") return;
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
