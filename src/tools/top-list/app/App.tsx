import { useCallback, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { CanvasFrame } from "@/shared/canvas/CanvasFrame";
import { ExportProgress, exportCanvasJpg } from "@/shared/canvas/exportJpg";
import { DataSummary, SheetSidebar } from "@/shared/canvas/SheetSidebar";
import { escapeHtml, htmlToText } from "@/shared/canvas/sheetText";
import { CanvasThemeId, getCanvasTheme } from "@/shared/canvas/themes";
import { clearSheetParam, useSheetLoader } from "@/shared/canvas/useSheetLoader";
import { warmImageCache } from "@/shared/utils/imageDataUrl";
import { TileCanvas } from "./components/TileCanvas";
import { DEFAULT_SIZE, EXAMPLES, PRESETS, SIZES, TopListSizeId } from "./constants";
import { Layout, ListItem, parseSheet } from "./utils/parseSheet";

const EXPORT_AREA_ID = "top-list-export-area";
const DEFAULT_TITLE = "<b>Top List</b>";
const DEFAULT_DATE = "<b>By Massive</b>";

interface LoadedSummary extends Omit<DataSummary, "headline" | "notes"> {
  layout: Layout;
}

export default function App() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [layout, setLayout] = useState<Layout>("grid");
  const [symbol, setSymbol] = useState("$");
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [date, setDate] = useState(DEFAULT_DATE);
  const [size, setSize] = useState<TopListSizeId>(DEFAULT_SIZE);
  const [theme, setTheme] = useState<CanvasThemeId>("light");
  const [showPresentedBy, setShowPresentedBy] = useState(true);
  const [summary, setSummary] = useState<LoadedSummary | null>(null);
  const [atMinimum, setAtMinimum] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const { width: canvasW, height: canvasH, label: sizeLabel } = SIZES.find((s) => s.id === size)!;
  const preset = PRESETS[size];

  const loadText = useCallback((text: string, delimiter: string | undefined, source: string) => {
    const sheet = parseSheet(text, delimiter);
    if (sheet.items.length === 0) {
      toast.error("No companies found. The sheet needs name and logo columns.");
      setItems([]);
      setSummary({ layout: sheet.layout, count: 0, skipped: sheet.skipped, duplicateNames: [] });
      return;
    }
    setItems(sheet.items);
    // Start converting logos now, so Download JPG doesn't have to wait for them.
    warmImageCache(sheet.items.map((i) => i.logoUrl));
    setLayout(sheet.layout);
    setSymbol(sheet.symbol);
    // Sheet text goes into a contentEditable as HTML, so escape it first.
    if (sheet.title) setTitle(`<b>${escapeHtml(sheet.title)}</b>`);
    if (sheet.date) setDate(`<b>${escapeHtml(sheet.date)}</b>`);
    setSummary({
      layout: sheet.layout,
      count: sheet.items.length,
      skipped: sheet.skipped,
      duplicateNames: sheet.duplicateNames,
    });

    const skippedNote = sheet.skipped.length > 0 ? ` (${sheet.skipped.length} rows skipped)` : "";
    toast.success(`Loaded ${sheet.items.length} companies from ${source}${skippedNote}`);
  }, []);

  // Also loads ?e=<sheet> on open (the dashboard's "Open in editor", and old /bento-map links).
  const loadSheet = useSheetLoader(loadText);
  const loadFirstExample = () => loadSheet(EXAMPLES[0].url, EXAMPLES[0].label);

  const unloadList = () => {
    setItems([]);
    setLayout("grid");
    setSummary(null);
    setAtMinimum(0);
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
        // e.g. "AI Agents - Sep 2026 - Light - Vertical"
        fileName: `${htmlToText(title)} - ${htmlToText(date)} - ${getCanvasTheme(theme).label} - ${sizeLabel}`,
        onProgress: setExportProgress,
      });
      toast.success("JPG exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export JPG");
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const sidebarSummary: DataSummary | null = summary && {
    ...summary,
    headline: `${summary.count} companies · ${
      summary.layout === "bento" ? "Bento, sized by value" : "Grid, equal tiles in rank order"
    }`,
    notes:
      atMinimum > 0
        ? [`${atMinimum} shown at minimum size, so they are larger than their value (not to scale).`]
        : undefined,
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="flex h-full overflow-hidden bg-bg">
        <SheetSidebar
          toolName="Top List"
          sizes={SIZES}
          size={size}
          onSizeChange={setSize}
          theme={theme}
          onThemeChange={setTheme}
          showPresentedBy={showPresentedBy}
          onShowPresentedByChange={setShowPresentedBy}
          summary={sidebarSummary}
          columnsHint={
            <>
              Columns: <span className="font-mono">name</span>, <span className="font-mono">logo</span>, and
              optionally <span className="font-mono">position</span>. Add a <span className="font-mono">value</span>{" "}
              column (4.2T, 91.5B, ~$361M) to switch to the Bento layout, sized by value.
            </>
          }
          examples={EXAMPLES}
          onLoadText={loadText}
          onLoadSheet={loadSheet}
          onUnload={unloadList}
          onExportJpg={handleExportJpg}
          isExporting={isExporting}
          exportProgress={exportProgress}
        />

        <CanvasFrame
          ref={canvasRef}
          exportId={EXPORT_AREA_ID}
          width={canvasW}
          height={canvasH}
          spacing={preset}
          theme={theme}
          title={title}
          onTitleChange={setTitle}
          subtitle={date}
          onSubtitleChange={setDate}
          showPresentedBy={showPresentedBy}
          presentedById="massiveLogo_grad_toplist"
          empty={items.length === 0}
          onLoadExample={loadFirstExample}
        >
          <TileCanvas
            layout={layout}
            items={items}
            symbol={symbol}
            minTileSide={preset.minTileSide}
            tileGap={preset.tileGap}
            onMinimumCountChange={setAtMinimum}
          />
        </CanvasFrame>
      </div>
    </>
  );
}
