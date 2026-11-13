# Gemini

**Status:** Implemented (2026-11-12) in `src/tools/gemini/`. The route is `/gemini`, live in the nav after Images.

## What it's for

Making images in Gemini (gemini.google.com) with several chats at once: the same prompt and reference images in 2 to 4
chats side by side, then keeping the best results. The tab doesn't generate anything; it sets up the windows, holds
what you paste into them, and saves what you bring back. It runs on your Gemini plan, with no API key or API cost.

## What the browser allows

- **Gemini can't be shown inside the page.** It sends `X-Frame-Options: DENY`, so the tab opens real windows instead.
- **Opened windows can't be controlled afterwards.** Gemini sends `Cross-Origin-Opener-Policy: same-origin-allow-popups`,
  and the browser cuts the link to a pop-up once a page with that header loads in it. Each window's size and place is
  set when it opens (`window.open` features); after that it can't be focused, moved or closed from here, so Open always
  opens a new set.
- **One pop-up per click.** Chrome blocks every pop-up after the first unless the site is allowed to open them. The tab
  says so and offers one button per blocked window.
- **The clipboard holds one thing at a time.** Hence Copy next, below.
- **A prompt can't be passed in the URL.** Gemini has no parameter for it, so the prompt is pasted too.

## Using it

The page is meant to sit in a narrow window at one side of the screen. It's one column up to `lg` and two from there.

1. **Gemini windows:** 2, 3 or 4, side by side or in two rows, in the 1st, 2nd or 3rd signed-in Google account
   (`/u/N/app`). They fill the side of the screen this window leaves free (`screen.availLeft/Width` against
   `window.screenX/outerWidth`). If this window leaves less than 40% of the screen, they cover the whole screen, and a
   tip says to make this one narrow. A small diagram shows where each will open.
2. **Prompt:** the text, plus options that add lines:
   - **Style:** Massive dark or light, from `brand/BRAND.md`'s registers.
   - **Format:** 1:1, 4:5, 16:9 or 9:16, with the sizes from "Sizes by channel".
   - **No other brands:** no other companies' logos or signs.
   - **List the attached images:** numbers the images in the set, in paste order, as the Content tab's photo prompts do.

   **Copy prompt** copies it all, and "The prompt as it's copied" shows it. The **library** keeps prompts with their
   options: Save, Update, Save as new, Delete with Undo.
3. **Attach:**
   - **Massive brand kit:** the two wordmarks, the mark, the white mark and the dark ground, from
     `public/image-projects/_brand/`. The logos are drawn as 2048 px PNGs on their own ground, because a transparent
     ink logo is invisible once Gemini puts it on black.
   - **Your references:** photos added with Add, Paste or a drop on the tray. Each name can be edited; it's how the
     prompt lists the photo.
   - **Copying:** a click on any image copies it. **+** adds it to the set, numbered in order.
   - **Copy next** (the bar at the bottom) copies the prompt, then each image in the set, one per click. You paste each
     one into every window before copying the next. Changing the set or the prompt starts it over.
4. **Saved:**
   - **Bringing results back:** ⌘V anywhere (except text pasted into a field), the Paste button, or a drop anywhere.
     For the full size, use Gemini's download button and drop the file; "Copy image" can give the smaller preview. A
     dropped link is fetched directly or through the image proxy.
   - **Runs:** images are grouped by run. A run starts when a prompt is copied, and copying the same prompt again
     continues it. Each group can copy its prompt again or load it back into the editor.
   - **Each image:** open full size (the Content tab's lightbox), copy it to edit it in Gemini, use it as a reference,
     download, or remove it from the gallery.
   - **Folder:** pick one once (Chrome and Edge, `showDirectoryPicker`). Each image goes to
     `<YYYY-MM-DD>/<HHmm>-<prompt words>-<n>.png`, with the prompt beside it as `<HHmm>-<prompt words>.txt`. Nothing
     that's already there is overwritten. The browser may ask for a click to allow writing again on a later visit.
     Other browsers download each saved image instead.

## Storage

- **localStorage:** the prompt, the options, the set, the current run, the library and the window settings. All keys
  start with `gemini:`.
- **IndexedDB** (`massive-gemini`): the references, the saved images and the folder handle. Images are too big for
  localStorage, and only IndexedDB can keep a folder handle.
- **Per browser:** everything is kept in this browser only. Nothing is uploaded.

## Files

| File | What |
|---|---|
| `app/App.tsx` | The page: state, saving, paste and drop |
| `app/windows.ts` | The free side of the screen, the tiles, opening a window |
| `app/clipboard.ts` | Any image (SVG too) to a PNG, and copying and reading images on the clipboard |
| `app/prompt.ts`, `app/kit.ts` | The prompt's added lines; the brand kit |
| `app/hooks.ts`, `app/db.ts`, `app/folder.ts` | localStorage values, the IndexedDB stores, the save folder |
| `app/components/` | `WindowsPanel`, `PromptPanel`, `AttachTray` (with `CopyNext`), `SavedGallery` |
