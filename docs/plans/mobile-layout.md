# Mobile layout

**Status:** Implemented (2026-10-01). Every visible tool and the homepage work on phones (tested at 390 × 844, iPhone 13). Desktop layouts are unchanged.

## Breakpoint

`md` (768 px): Tailwind's breakpoint and `useIsMobile()` (`src/shared/components/ui/use-mobile.ts`) agree. The hook starts from the current `matchMedia` result, so phones never render a frame of the desktop layout.

## Shared pieces

- **`SidebarLayout`** (`src/shared/components/SidebarLayout.tsx`) lays out every tool that has a sidebar.
  - Desktop: the sidebar column, then the main area.
  - Phones: the main area fills the screen, above a bottom bar with **Edit**, which opens the sidebar's sections in a bottom drawer (vaul, `ui/drawer.tsx`), and the tool's main action.
    - The Edit button is labelled per tool: **Import** while a canvas tool has nothing loaded, **Library** in Video.
    - An amber dot on Edit means a warning is waiting in the drawer.
    - The bar pads for the iPhone home indicator (`env(safe-area-inset-bottom)`, with `viewport-fit=cover` in `index.html`).
- The same file holds the sidebar's look, so every tool matches:
  - `SidebarColumn`: tool name, scrolling sections, pinned footer
  - `SidebarWarning`: amber callout with ×
  - `sidebarButtonClass`, `sidebarInputClass`, `sidebarHeadingClass`
- **`useFitScale`** (`src/shared/canvas/useFitScale.ts`) scales a fixed-size design to fit its box (5% margin). Used by `CanvasFrame` and Partnership Post.
- **Header:** on phones, the logo, the current tool's name and a ☰ button that opens the tool list in a side sheet (same order, groups and divider as the desktop nav).
- **Viewport height:**
  - Tool pages use `h-dvh`, so iOS Safari's address bar doesn't cut off the bottom bar.
  - Partnership Post and Social Media were `h-screen` inside the tool layout, which cut their bottom off by the header's height, on desktop too. They're `h-full` now.
- **Form fields** are 16 px on phones (`src/styles/index.css`); smaller text makes iOS Safari zoom in on focus.

## Per page

| Page | Phones |
|---|---|
| Homepage | Each row of the tracker is a card (status and date, name, Linear / Sheet / Open). A Sort select stands in for the table's clickable headers. |
| Market Map, Top List | Canvas fills the screen. The drawer has warnings, Size, Theme, Data, Import, Examples. The bar has **Download JPG**, with the export progress filling the button. The drawer closes when a sheet loads. |
| Partnership Post | Preview fitted to the width. The drawer has the image URL and template. The bar has JPG and PNG. |
| Video | A viewer: the Library opens as the drawer and closes when you pick a video. The Script / Storyboard / Preview switch sits in the bar. The render command is hidden, since it needs a local checkout. |
| Logo Encoder | Image and result fill the screen. The drawer has Source, Square, Size and Output. The bar has **Copy data URL**. |

## Exports on phones

`saveFile` (`src/shared/utils/saveFile.ts`), used by the canvas tools, Partnership Post and Logo Encoder:
- **On touch devices:** opens the share sheet with the file first. On iOS, "Save Image" puts it in Photos.
- **Share sheet not allowed:** sharing needs a recent tap, and a long export can outlast it. Then it falls back to a download.
- **Download:** always uses a blob URL. iOS opens `data:` links in a tab instead of saving them.

On iPhone and iPad every browser is WebKit. The canvas tools warn there that logos and effects can render differently, and suggest exporting the final file from Chrome on a computer.

## Not done

- **Title and subtitle editing:** still on the canvas, so the text is small to tap on a phone.
- **Deprecated tools** (Social Media, Campaign Designer, Dither) weren't adapted.
