# Logo Encoder

**Status:** Implemented (2026-10-01) in `src/tools/logo-encoder/`. It replaces Image Converter. The route is `/logo-encoder`, and `/image-upload` redirects there.

## What it's for

It turns any image into a **square PNG data URL** (`data:image/png;base64,…`), ready to paste into the `logo` column of a Top List or Market Map sheet. Those columns accept a `data:` URL wherever an image link would go.

## Using it

1. **Source:** Upload, drop anywhere, paste (⌘V / Ctrl+V or the Paste button), or **Import from URL**.
   - URLs load directly when the host allows it, otherwise through `/api/image-proxy` (`loadAsDataUrl`).
   - Either way the image becomes a data URL first, so the canvas is never tainted.
2. **Square:** how a non-square image becomes square. It is **never stretched**.
   - **Crop** (default): a square box, centred at first, that you drag on the image. "Lock to center" keeps it centred.
   - **Fit:** the whole image, centred, with transparent padding.
3. **Size:** 32, 64, **128** (default), 256, 512, or Custom (one side, 1–1024 px).
4. **Output:** updates live, 150 ms after the last change. There's no Regenerate button.
   - **Copy data URL** is the main action.
   - **Download PNG** saves the file.
   - The Output section gives the size and character count, and can show the data URL itself.

The result is previewed on a checkerboard, a light background and a dark background (the canvas tools' pill colours), so transparency and contrast both show.

## Warnings

Above Copy, with the same amber style as the canvas tools:
- **Too long for a sheet:** over 50,000 characters, which is Google Sheets' limit for one cell. Try a smaller size.
- **Upscaled:** the cropped area (or, in Fit, the image's longer side) is smaller than the output, so it may look soft.

## Fixed from Image Converter

- **Stretching:** a non-square image was stretched to 128 × 128 until the crop was dragged, because the first pass used the whole image. Now the starting crop is the largest centred square.
- **Regenerating:** changing settings did nothing until "Regenerate Base64" was clicked. Now the output is live.
- **Duplicated code:** the two near-identical encoders are now one, `encodeSquare` in `utils/encode.ts`.
- **Layout:** numbered cards and a "How to Use" card with light-theme leftovers. Now the same sidebar layout as the other tools, and it works on phones.

## Files

```
src/tools/logo-encoder/app/
  App.tsx              state, sources (file, paste, URL, drop), sidebar sections, warnings
  components/Stage.tsx crop editor / Fit frame, and the result preview
  utils/encode.ts      encodeSquare, sourceSide, copyText, nameFromUrl, SHEETS_CELL_LIMIT
```
