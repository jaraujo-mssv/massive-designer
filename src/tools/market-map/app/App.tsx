import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { CanvasFrame } from "@/shared/canvas/CanvasFrame";
import { EditPanel } from "@/shared/canvas/edit/EditPanel";
import { EditPopover } from "@/shared/canvas/edit/EditPopover";
import { copySheetTsv, downloadSheetTsv, toSheetTsv } from "@/shared/canvas/edit/sheetExport";
import { useDiscardGuard, useEditHistory } from "@/shared/canvas/edit/useEditHistory";
import { ExportProgress, exportCanvasJpg } from "@/shared/canvas/exportJpg";
import { DataSummary, SheetSidebar } from "@/shared/canvas/SheetSidebar";
import { escapeHtml, htmlToText } from "@/shared/canvas/sheetText";
import { CANVAS_SIZES, CanvasSizeId, DEFAULT_CANVAS_SIZE, FRAME_SPACING, TILE_GAP } from "@/shared/canvas/sizes";
import { CanvasThemeId, getCanvasTheme } from "@/shared/canvas/themes";
import { VersionSwitch } from "@/shared/canvas/ToolVersion";
import { clearSheetParam, useSheetLoader } from "@/shared/canvas/useSheetLoader";
import { warmImageCache } from "@/shared/utils/imageDataUrl";
import { FitWarning } from "./components/FitWarning";
import { FitInfo, MapCanvas } from "./components/MapCanvas";
import { MapEditor, MapEditTarget } from "./components/MapEditor";
import { EXAMPLES } from "./constants";
import type { FitMode } from "./utils/layout";
import { Category, parseSheet } from "./utils/parseSheet";

const EXPORT_AREA_ID = "market-map-export-area";
const DEFAULT_TITLE = "<b>Market Map</b>";
const DEFAULT_DATE = "<b>By Massive</b>";

interface LoadedSummary extends Omit<DataSummary, "headline" | "notes"> {
  categoryCount: number;
}

export default function App() {
  // The map's data, as loaded and then edited on the canvas (with undo).
  const history = useEditHistory<Category[]>([]);
  const categories = history.value;
  const confirmDiscard = useDiscardGuard(history.dirty);
  // The open click-to-edit popover: what it edits and where it's anchored.
  const [editing, setEditing] = useState<{ target: MapEditTarget; anchor: HTMLElement } | null>(null);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [date, setDate] = useState(DEFAULT_DATE);
  const [size, setSize] = useState<CanvasSizeId>(DEFAULT_CANVAS_SIZE);
  const [theme, setTheme] = useState<CanvasThemeId>("light");
  const [showPresentedBy, setShowPresentedBy] = useState(true);
  const [summary, setSummary] = useState<LoadedSummary | null>(null);
  // How a map too big for readable pills is made to fit; kept across loads.
  const [fitMode, setFitMode] = useState<FitMode>("shrink");
  const [fit, setFit] = useState<FitInfo | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const { width: canvasW, height: canvasH, label: sizeLabel } = CANVAS_SIZES.find((s) => s.id === size)!;
  const companyCount = categories.reduce((n, c) => n + c.companies.length, 0);
  const logoUrls = useMemo(() => categories.flatMap((c) => c.companies.map((co) => co.logoUrl)), [categories]);

  // Convert logos ahead (on load and after edits), so Download JPG doesn't wait for them.
  useEffect(() => warmImageCache(logoUrls), [logoUrls]);

  const loadText = useCallback((text: string, delimiter: string | undefined, source: string) => {
    const sheet = parseSheet(text, delimiter);
    if (sheet.companyCount === 0) {
      toast.error("No companies found. The sheet needs category, company and logo columns.");
      history.load([]);
      setSummary({ count: 0, categoryCount: 0, skipped: sheet.skipped, duplicateNames: [] });
      return;
    }
    setEditing(null);
    history.load(sheet.categories);
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
    // history.load is stable.
  }, []);

  // Also loads ?e=<sheet> on open (the dashboard's "Open in editor").
  const loadSheet = useSheetLoader(loadText);
  const loadFirstExample = () => loadSheet(EXAMPLES[0].url, EXAMPLES[0].label);

  // Loading another sheet or unloading throws edits away: ask first.
  const guardedLoadText: typeof loadText = (...args) => {
    if (confirmDiscard()) loadText(...args);
  };
  const guardedLoadSheet: typeof loadSheet = async (...args) => {
    if (confirmDiscard()) await loadSheet(...args);
  };

  const unloadMap = () => {
    if (!confirmDiscard()) return;
    setEditing(null);
    history.load([]);
    setSummary(null);
    setFit(null);
    setTitle(DEFAULT_TITLE);
    setDate(DEFAULT_DATE);
    clearSheetParam();
  };

  const handleExportJpg = async () => {
    const element = canvasRef.current;
    if (!element) return;
    setEditing(null);
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

  const sheetRows = () => categories.flatMap((c) => c.companies.map((co) => [c.name, co.name, co.logoUrl]));
  const sheetTsv = (rows: string[][]) =>
    toSheetTsv({ title, date, header: ["category", "company", "logo"], rows });

  const sidebarSummary: DataSummary | null = summary && {
    ...summary,
    // Live counts, so they follow edits.
    headline: `${categories.length} categories · ${companyCount} companies`,
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <SheetSidebar
        toolName="Market Map"
        versionSwitch={<VersionSwitch confirmLeave={confirmDiscard} />}
        sizes={CANVAS_SIZES}
        size={size}
        onSizeChange={setSize}
        theme={theme}
        onThemeChange={setTheme}
        showPresentedBy={showPresentedBy}
        onShowPresentedByChange={setShowPresentedBy}
        summary={sidebarSummary}
        editPanel={
          <EditPanel
            hint="Click a company or category on the map to edit it."
            dirty={history.dirty}
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            onUndo={history.undo}
            onRedo={history.redo}
            onReset={history.reset}
            addLabel="Add category"
            onAdd={(anchor) => setEditing({ target: { kind: "new-category" }, anchor })}
            onDownloadTsv={() => {
              const rows = sheetRows();
              downloadSheetTsv(htmlToText(title) || "Market Map", sheetTsv(rows), rows, 1);
            }}
            onCopyTsv={() => {
              const rows = sheetRows();
              void copySheetTsv(sheetTsv(rows), rows, 1);
            }}
          />
        }
        columnsHint={
          <>
            Columns: <span className="font-mono">category</span>, <span className="font-mono">company</span>,{" "}
            <span className="font-mono">logo</span>. One row per company; each category becomes a tile, sized to
            fit its companies.
          </>
        }
        examples={EXAMPLES}
        onLoadText={guardedLoadText}
        onLoadSheet={guardedLoadSheet}
        onUnload={unloadMap}
        unloadLabel="Unload map"
        onExportJpg={handleExportJpg}
        isExporting={isExporting}
        exportProgress={exportProgress}
        logoUrls={logoUrls}
        warnings={
          fit &&
          categories.length > 0 &&
          (!fit.readable || fit.hidden.length > 0) && (
            <FitWarning
              fit={fit}
              fitMode={fitMode}
              onFitModeChange={setFitMode}
              companyCount={companyCount}
            />
          )
        }
      >
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
          <MapCanvas
            categories={categories}
            tileGap={TILE_GAP}
            fitMode={fitMode}
            onFitChange={setFit}
            onEdit={isExporting ? undefined : (target, anchor) => setEditing({ target, anchor })}
          />
        </CanvasFrame>
        <EditPopover anchor={editing?.anchor ?? null} onCancel={() => setEditing(null)}>
          {editing && (
            <MapEditor
              // A fresh form (and draft) for each target.
              key={JSON.stringify(editing.target)}
              target={editing.target}
              categories={categories}
              hidden={fit?.hidden ?? []}
              onCommit={history.commit}
              onNavigate={(target) => setEditing((e) => e && { ...e, target })}
              onClose={() => setEditing(null)}
            />
          )}
        </EditPopover>
      </SheetSidebar>
    </>
  );
}
