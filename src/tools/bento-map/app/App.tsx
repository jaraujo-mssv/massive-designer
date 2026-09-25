import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { PresentedBy } from "@/shared/canvas/PresentedBy";
import { exportCanvasJpg } from "@/shared/canvas/exportJpg";
import { CanvasThemeId, canvasThemeClass, getCanvasTheme } from "@/shared/canvas/themes";
import { fetchGoogleSheetTsv } from "@/shared/utils/googleSheets";
import { BentoCanvas } from "./components/BentoCanvas";
import { DataSummary, Sidebar } from "./components/Sidebar";
import { BENTO_PRESETS, BENTO_SIZES, BentoSizeId, TEMPLATE_SHEET_URL } from "./constants";
import { BentoItem, parseSheet } from "./utils/parseSheet";

const EXPORT_AREA_ID = "bento-map-export-area";

function escapeHtml(text: string): string {
  const el = document.createElement("div");
  el.textContent = text;
  return el.innerHTML;
}

function htmlToText(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent || "";
}

export default function App() {
  const [items, setItems] = useState<BentoItem[]>([]);
  const [symbol, setSymbol] = useState("$");
  const [title, setTitle] = useState("<b>Bento Map</b>");
  const [date, setDate] = useState("<b>By Massive</b>");
  const [size, setSize] = useState<BentoSizeId>("square");
  const [theme, setTheme] = useState<CanvasThemeId>("dark");
  const [showPresentedBy, setShowPresentedBy] = useState(true);
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [atMinimum, setAtMinimum] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDims, setContainerDims] = useState({ w: 0, h: 0 });

  const { width: canvasW, height: canvasH } = BENTO_SIZES.find((s) => s.id === size)!;
  const preset = BENTO_PRESETS[size];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerDims({ w: width, h: height });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const canvasScale =
    containerDims.w > 0 ? Math.min(containerDims.w / canvasW, containerDims.h / canvasH) * 0.95 : 0.5;

  const loadText = useCallback((text: string, delimiter: string | undefined, source: string) => {
    const sheet = parseSheet(text, delimiter);
    if (sheet.items.length === 0) {
      toast.error("No companies found. The sheet needs name, logo and value columns.");
      setItems([]);
      setSummary({ count: 0, skipped: sheet.skipped, duplicateNames: [] });
      return;
    }
    setItems(sheet.items);
    setSymbol(sheet.symbol);
    // Sheet text goes into a contentEditable as HTML, so escape it first.
    if (sheet.title) setTitle(`<b>${escapeHtml(sheet.title)}</b>`);
    if (sheet.date) setDate(`<b>${escapeHtml(sheet.date)}</b>`);
    setSummary({ count: sheet.items.length, skipped: sheet.skipped, duplicateNames: sheet.duplicateNames });

    const skippedNote = sheet.skipped.length > 0 ? ` (${sheet.skipped.length} rows skipped)` : "";
    toast.success(`Loaded ${sheet.items.length} companies from ${source}${skippedNote}`);
  }, []);

  const loadSheet = useCallback(
    async (urlOrId: string, source = "Google Sheets") => {
      const toastId = toast.loading(`Loading data from ${source}...`);
      try {
        const text = await fetchGoogleSheetTsv(urlOrId);
        toast.dismiss(toastId);
        loadText(text, "\t", source);
      } catch (error) {
        toast.dismiss(toastId);
        toast.error(`Failed to import: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    },
    [loadText],
  );

  const loadTemplate = () => loadSheet(TEMPLATE_SHEET_URL, "the template");

  // ?e=<sheet url or id> loads a Google Sheet on open, like Top List and Market Map.
  useEffect(() => {
    const sheet = new URLSearchParams(window.location.search).get("e");
    if (sheet) loadSheet(sheet);
  }, [loadSheet]);

  const handleExportJpg = async () => {
    const element = canvasRef.current;
    if (!element) return;
    setIsExporting(true);
    try {
      await exportCanvasJpg(element, {
        width: canvasW,
        height: canvasH,
        backgroundSrc: getCanvasTheme(theme).exportBg,
        fileName: `${htmlToText(title)} - ${htmlToText(date)}`,
      });
      toast.success("JPG exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export JPG");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex h-full overflow-hidden bg-bg">
        <Sidebar
          size={size}
          onSizeChange={setSize}
          theme={theme}
          onThemeChange={setTheme}
          showPresentedBy={showPresentedBy}
          onShowPresentedByChange={setShowPresentedBy}
          summary={summary}
          atMinimum={atMinimum}
          onLoadText={loadText}
          onLoadSheet={loadSheet}
          onLoadTemplate={loadTemplate}
          onExportJpg={handleExportJpg}
          isExporting={isExporting}
        />

        {/* Canvas Area */}
        <div
          ref={containerRef}
          className={`flex-1 flex items-center justify-center overflow-hidden ${canvasThemeClass(theme)}`}
          style={{ backgroundColor: "#0d0c17" }}
        >
          <div style={{ width: canvasW * canvasScale, height: canvasH * canvasScale, flexShrink: 0 }}>
            <div
              id={EXPORT_AREA_ID}
              ref={canvasRef}
              style={{
                width: canvasW,
                height: canvasH,
                backgroundColor: "var(--canvas-bg)",
                backgroundImage: "var(--canvas-export-bg-image)",
                backgroundSize: "var(--canvas-export-bg-size)",
                backgroundPosition: "center",
                transform: `scale(${canvasScale})`,
                transformOrigin: "top left",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-6 shrink-0"
                style={{
                  padding: `${preset.sitePadding}px ${preset.sitePadding}px ${preset.headerBottomPadding}px`,
                }}
              >
                <div className="flex-1 flex flex-col min-w-0">
                  <RichTextEditor
                    value={title}
                    onChange={setTitle}
                    className="bg-transparent border-none outline-none rounded"
                    style={{
                      fontFamily: "Outfit, sans-serif",
                      color: "var(--canvas-text)",
                      fontSize: `${preset.titleFontSize}px`,
                      lineHeight: 1.1,
                      fontWeight: 900,
                    }}
                  />
                  <RichTextEditor
                    value={date}
                    onChange={setDate}
                    className="bg-transparent border-none outline-none rounded"
                    style={{
                      fontFamily: "Outfit, sans-serif",
                      color: "var(--canvas-red)",
                      fontSize: `${preset.subtitleFontSize}px`,
                      lineHeight: 1.1,
                      fontWeight: 900,
                    }}
                  />
                </div>
                {showPresentedBy && <PresentedBy gradientId="massiveLogo_grad_bento" />}
              </div>

              {/* Treemap */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  padding: `0 ${preset.sitePadding}px ${preset.sitePadding}px`,
                }}
              >
                {items.length > 0 ? (
                  <BentoCanvas
                    items={items}
                    symbol={symbol}
                    minTileSide={preset.minTileSide}
                    tileGap={preset.tileGap}
                    onMinimumCountChange={setAtMinimum}
                  />
                ) : (
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
                      onClick={loadTemplate}
                      style={{ color: "var(--canvas-red)", fontSize: 18, textDecoration: "underline" }}
                    >
                      Load the template
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
