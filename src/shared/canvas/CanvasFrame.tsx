import { forwardRef, useRef } from "react";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { PresentedBy } from "./PresentedBy";
import { CanvasThemeId, canvasThemeClass } from "./themes";
import { useFitScale } from "./useFitScale";

export interface FrameSpacing {
  sitePadding: number;
  headerBottomPadding: number;
  titleFontSize: number;
  subtitleFontSize: number;
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
    empty,
    onLoadExample,
    children,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(containerRef, width, height);
  const titleStyle = { fontFamily: "Outfit, sans-serif", lineHeight: 1.1, fontWeight: 900 } as const;

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex items-center justify-center overflow-hidden ${canvasThemeClass(theme)}`}
      style={{ backgroundColor: "#0d0c17" }}
    >
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
            style={{ padding: `${spacing.sitePadding}px ${spacing.sitePadding}px ${spacing.headerBottomPadding}px` }}
          >
            <div className="flex-1 flex flex-col min-w-0">
              <RichTextEditor
                value={title}
                onChange={onTitleChange}
                className="bg-transparent border-none outline-none rounded"
                style={{ ...titleStyle, color: "var(--canvas-text)", fontSize: `${spacing.titleFontSize}px` }}
              />
              <RichTextEditor
                value={subtitle}
                onChange={onSubtitleChange}
                className="bg-transparent border-none outline-none rounded"
                style={{ ...titleStyle, color: "var(--canvas-red)", fontSize: `${spacing.subtitleFontSize}px` }}
              />
            </div>
            {showPresentedBy && <PresentedBy gradientId={presentedById} />}
          </div>

          <div style={{ flex: 1, minHeight: 0, padding: `0 ${spacing.sitePadding}px ${spacing.sitePadding}px` }}>
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
        </div>
      </div>
    </div>
  );
});
