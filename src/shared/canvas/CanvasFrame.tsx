import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { wrapLines } from "./measureText";
import { PresentedBy } from "./PresentedBy";
import { CanvasThemeId, canvasThemeClass } from "./themes";
import { useFitScale } from "./useFitScale";

export interface FrameSpacing {
  sitePadding: number;
  headerBottomPadding: number;
  titleFontSize: number;
  subtitleFontSize: number;
}

/** The title's sizes, in canvas px, when it's fitted to the header (`titleFit`). */
export interface TitleFit {
  min: number;
  max: number;
}

const TITLE_WEIGHT = 900;
/** A fitted title fills about this many lines; its subtitle, one. */
const TITLE_LINES = 2;
const SUBTITLE_LINES = 1;
/**
 * A fitted subtitle may shrink to fit its line down to this share of the title,
 * then wraps instead: smaller, it stops reading as the title's H2.
 */
const SUBTITLE_MIN_SHARE = 0.5;

/** The text's paragraphs as plain text: the editor's line breaks start new ones. */
function textParagraphs(html: string): string[] {
  const el = document.createElement("div");
  el.innerHTML = html.replace(/<br\s*\/?>|<\/?(div|p)\b[^>]*>/gi, "\n");
  return (el.textContent ?? "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * The biggest size, from `max` down to `min`, at which `html`'s text takes no
 * more than `maxLines` lines (or one per paragraph, if it has more) `width`
 * wide. Short text stays at `max`; long text wraps further at `min`.
 */
function fittedSize(html: string, width: number, { min, max }: TitleFit, maxLines: number): number {
  const paragraphs = textParagraphs(html);
  const lines = (size: number) =>
    paragraphs.reduce((n, p) => n + (wrapLines(p, width, size, TITLE_WEIGHT, Infinity)?.length ?? Infinity), 0);
  const allowed = Math.max(maxLines, paragraphs.length);
  for (let size = max; size > min; size -= 1) if (lines(size) <= allowed) return size;
  return min;
}

interface CanvasFrameProps {
  /** Id of the exported element; `exportCanvasJpg` needs one. */
  exportId: string;
  width: number;
  height: number;
  spacing: FrameSpacing;
  theme: CanvasThemeId;
  title: string;
  onTitleChange: (html: string) => void;
  subtitle: string;
  onSubtitleChange: (html: string) => void;
  showPresentedBy: boolean;
  /** Unique per tool: SVG gradient ids are global on the page. */
  presentedById: string;
  /**
   * `side` (default): title on the left, "Presented by" beside it. `centered`:
   * the old Top List's header, title centred and "Presented by" at the bottom right.
   */
  headerStyle?: "side" | "centered";
  /**
   * Fits the title to about two lines of the header, between these sizes,
   * instead of `spacing.titleFontSize`, and the subtitle to one line in
   * proportion to it (see `subtitleFontSize` below).
   */
  titleFit?: TitleFit;
  /**
   * Moves the header this far down, so it sits on top of a body whose content
   * doesn't reach the top (Top List's legacy List, centred in its box).
   */
  headerOffset?: number;
  /** Over the preview's top-left corner, outside the exported image: the New | Legacy switch (VersionSwitch). */
  corner?: React.ReactNode;
  /** Shows the "Import a spreadsheet" placeholder instead of `children`. */
  empty: boolean;
  onLoadExample: () => void;
  children: React.ReactNode;
}

/**
 * The canvas shared by the sheet-driven tools: fitted to the viewport, with the
 * title/subtitle header, the "Presented by" mark and a body for the tool's
 * layout. The forwarded ref is the element to export.
 */
export const CanvasFrame = forwardRef<HTMLDivElement, CanvasFrameProps>(function CanvasFrame(
  {
    exportId,
    width,
    height,
    spacing,
    theme,
    title,
    onTitleChange,
    subtitle,
    onSubtitleChange,
    showPresentedBy,
    presentedById,
    headerStyle = "side",
    titleFit,
    headerOffset = 0,
    corner,
    empty,
    onLoadExample,
    children,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(containerRef, width, height);
  const centered = headerStyle === "centered";
  const footer = centered && showPresentedBy;
  const titleStyle = {
    fontFamily: "Outfit, sans-serif",
    lineHeight: 1.1,
    fontWeight: TITLE_WEIGHT,
    textAlign: centered ? "center" : undefined,
  } as const;

  // The title column's width, in canvas px (the preview's scale() doesn't change it), for titleFit.
  const titleColumnRef = useRef<HTMLDivElement>(null);
  const [titleWidth, setTitleWidth] = useState(0);
  useEffect(() => {
    const el = titleColumnRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setTitleWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // The title is measured in Outfit 900: fit it again once that has loaded.
  const [fontsVersion, setFontsVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    document.fonts?.load(`${TITLE_WEIGHT} 100px Outfit`).then(() => {
      if (!cancelled) setFontsVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const { titleFontSize, subtitleFontSize } = useMemo(() => {
    if (!titleFit || titleWidth === 0) {
      return { titleFontSize: spacing.titleFontSize, subtitleFontSize: spacing.subtitleFontSize };
    }
    // A couple of px to spare, so the browser's wrapping doesn't find a line more than the measure did.
    const width = titleWidth - 2;
    const titleSize = fittedSize(title, width, titleFit, TITLE_LINES);
    // The subtitle keeps the spacing's proportion to the title (32 to 44), as an H2 to its H1,
    // and shrinks to fit its line only so far.
    const ratio = spacing.subtitleFontSize / spacing.titleFontSize;
    const subtitleFit = { min: titleSize * SUBTITLE_MIN_SHARE, max: titleSize * ratio };
    return { titleFontSize: titleSize, subtitleFontSize: fittedSize(subtitle, width, subtitleFit, SUBTITLE_LINES) };
    // fontsVersion re-runs the fit after the font loads.
  }, [title, subtitle, titleWidth, titleFit?.min, titleFit?.max, spacing.titleFontSize, spacing.subtitleFontSize, fontsVersion]);

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 flex items-center justify-center overflow-hidden ${canvasThemeClass(theme)}`}
      style={{ backgroundColor: "#0d0c17" }}
    >
      {corner}
      <div style={{ width: width * scale, height: height * scale, flexShrink: 0 }}>
        <div
          id={exportId}
          ref={ref}
          style={{
            width,
            height,
            backgroundColor: "var(--canvas-bg)",
            backgroundImage: "var(--canvas-export-bg-image)",
            backgroundSize: "var(--canvas-export-bg-size)",
            backgroundPosition: "center",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            className="flex items-center gap-6 shrink-0"
            style={{
              padding: `${spacing.sitePadding}px ${spacing.sitePadding}px ${spacing.headerBottomPadding}px`,
              // Moved, not laid out again: the body keeps its height, so its content stays where it is.
              position: headerOffset ? "relative" : undefined,
              top: headerOffset || undefined,
            }}
          >
            <div ref={titleColumnRef} className="flex-1 flex flex-col min-w-0">
              <RichTextEditor
                value={title}
                onChange={onTitleChange}
                className="bg-transparent border-none outline-none rounded"
                style={{
                  ...titleStyle,
                  color: "var(--canvas-text)",
                  fontSize: `${titleFontSize}px`,
                  // A fitted title's lines come out about as long as each other.
                  textWrap: titleFit ? "balance" : undefined,
                }}
              />
              <RichTextEditor
                value={subtitle}
                onChange={onSubtitleChange}
                className="bg-transparent border-none outline-none rounded"
                style={{
                  ...titleStyle,
                  color: "var(--canvas-red)",
                  fontSize: `${subtitleFontSize}px`,
                  textWrap: titleFit ? "balance" : undefined,
                }}
              />
            </div>
            {showPresentedBy && !centered && <PresentedBy gradientId={presentedById} />}
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: `0 ${spacing.sitePadding}px ${footer ? spacing.headerBottomPadding : spacing.sitePadding}px`,
            }}
          >
            {empty ? (
              <div
                className="h-full flex flex-col items-center justify-center gap-3 rounded-lg"
                style={{
                  border: "2px dashed var(--canvas-border-15)",
                  color: "var(--canvas-text-dim)",
                  fontFamily: "Outfit, sans-serif",
                  fontSize: 22,
                }}
              >
                Import a spreadsheet to start
                <button
                  onClick={onLoadExample}
                  style={{ color: "var(--canvas-red)", fontSize: 18, textDecoration: "underline" }}
                >
                  Load an example
                </button>
              </div>
            ) : (
              children
            )}
          </div>

          {footer && (
            <div
              className="flex justify-end shrink-0"
              style={{ padding: `0 ${spacing.sitePadding}px ${spacing.sitePadding}px` }}
            >
              <PresentedBy gradientId={presentedById} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
