import { useCallback, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { CanvasFrame } from "@/shared/canvas/CanvasFrame";
import { exportCanvasJpg } from "@/shared/canvas/exportJpg";
import { DataSummary, SheetSidebar } from "@/shared/canvas/SheetSidebar";
import { escapeHtml, htmlToText } from "@/shared/canvas/sheetText";
import { CANVAS_SIZES, CanvasSizeId, DEFAULT_CANVAS_SIZE, FRAME_SPACING, TILE_GAP } from "@/shared/canvas/sizes";
import { CanvasThemeId, getCanvasTheme } from "@/shared/canvas/themes";
import { clearSheetParam, useSheetLoader } from "@/shared/canvas/useSheetLoader";
import { MapCanvas } from "./components/MapCanvas";
import { EXAMPLES } from "./constants";
import { Category, parseSheet } from "./utils/parseSheet";

const EXPORT_AREA_ID = "market-map-export-area";
const DEFAULT_TITLE = "<b>Market Map</b>";
const DEFAULT_DATE = "<b>By Massive</b>";

interface LoadedSummary extends Omit<DataSummary, "headline" | "notes"> {
  categoryCount: number;
}

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [date, setDate] = useState(DEFAULT_DATE);
  const [size, setSize] = useState<CanvasSizeId>(DEFAULT_CANVAS_SIZE);
  const [theme, setTheme] = useState<CanvasThemeId>("light");
  const [showPresentedBy, setShowPresentedBy] = useState(true);
  const [summary, setSummary] = useState<LoadedSummary | null>(null);
  const [overflow, setOverflow] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const { width: canvasW, height: canvasH } = CANVAS_SIZES.find((s) => s.id === size)!;

  const loadText = useCallback((text: string, delimiter: string | undefined, source: string) => {
    const sheet = parseSheet(text, delimiter);
    if (sheet.companyCount === 0) {
      toast.error("No companies found. The sheet needs category, company and logo columns.");
      setCategories([]);
      setSummary({ count: 0, categoryCount: 0, skipped: sheet.skipped, duplicateNames: [] });
      return;
    }
    setCategories(sheet.categories);
    // Sheet text goes into a contentEditable as HTML, so escape it first.
    if (sheet.title) setTitle(`<b>${escapeHtml(sheet.title)}</b>`);
    if (sheet.date) setDate(`<b>${escapeHtml(sheet.date)}</b>`);
    setSummary({
      count: sheet.companyCount,
      categoryCount: sheet.categories.length,
      skipped: sheet.skipped,
      duplicateNames: sheet.duplicateNames,
    });

    const skippedNote = sheet.skipped.length > 0 ? ` (${sheet.skipped.length} rows skipped)` : "";
    toast.success(
      `Loaded ${sheet.companyCount} companies in ${sheet.categories.length} categories from ${source}${skippedNote}`,
    );
  }, []);

  // Also loads ?e=<sheet> on open (the dashboard's "Open in editor").
  const loadSheet = useSheetLoader(loadText);
  const loadFirstExample = () => loadSheet(EXAMPLES[0].url, EXAMPLES[0].label);

  const unloadMap = () => {
    setCategories([]);
    setSummary(null);
    setOverflow(false);
    setTitle(DEFAULT_TITLE);
    setDate(DEFAULT_DATE);
    clearSheetParam();
  };

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

  const sidebarSummary: DataSummary | null = summary && {
    ...summary,
    headline: `${summary.categoryCount} categories · ${summary.count} companies`,
    notes: overflow
      ? ["Too many companies to fit, even at the smallest pill size. Some may be cut off; try Horizontal."]
      : undefined,
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex h-full overflow-hidden bg-bg">
        <SheetSidebar
          toolName="Market Map"
          sizes={CANVAS_SIZES}
          size={size}
          onSizeChange={setSize}
          theme={theme}
          onThemeChange={setTheme}
          showPresentedBy={showPresentedBy}
          onShowPresentedByChange={setShowPresentedBy}
          summary={sidebarSummary}
          columnsHint={
            <>
              Columns: <span className="font-mono">category</span>, <span className="font-mono">company</span>,{" "}
              <span className="font-mono">logo</span>. One row per company; each category becomes a tile, sized to
              fit its companies.
            </>
          }
          examples={EXAMPLES}
          onLoadText={loadText}
          onLoadSheet={loadSheet}
          onUnload={unloadMap}
          unloadLabel="Unload map"
          onExportJpg={handleExportJpg}
          isExporting={isExporting}
        />

        <CanvasFrame
          ref={canvasRef}
          exportId={EXPORT_AREA_ID}
          width={canvasW}
          height={canvasH}
          spacing={FRAME_SPACING[size]}
          theme={theme}
          title={title}
          onTitleChange={setTitle}
          subtitle={date}
          onSubtitleChange={setDate}
          showPresentedBy={showPresentedBy}
          presentedById="massiveLogo_grad_marketmap"
          empty={categories.length === 0}
          onLoadExample={loadFirstExample}
        >
          <MapCanvas categories={categories} tileGap={TILE_GAP} onOverflowChange={setOverflow} />
        </CanvasFrame>
      </div>
    </>
  );
}
