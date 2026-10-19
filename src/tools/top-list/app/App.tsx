import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListNumbers, SquaresFour } from "@phosphor-icons/react";
import { Toaster, toast } from "sonner";
import { CanvasFrame } from "@/shared/canvas/CanvasFrame";
import { EditPanel } from "@/shared/canvas/edit/EditPanel";
import { EditPopover } from "@/shared/canvas/edit/EditPopover";
import { copySheetTsv, downloadSheetTsv, toSheetTsv } from "@/shared/canvas/edit/sheetExport";
import { useDiscardGuard, useEditHistory } from "@/shared/canvas/edit/useEditHistory";
import { Segmented } from "@/shared/canvas/DesignPanel";
import { ExportProgress, exportCanvasJpg } from "@/shared/canvas/exportJpg";
import { LogoSourcesProvider } from "@/shared/canvas/logos/LogoSourcesContext";
import { resolvedLogoSync, whenLogosSettled } from "@/shared/canvas/logos/resolve";
import { INITIALS, logoDevTokenFrom } from "@/shared/canvas/logos/sources";
import { legibleSizes, phonePt, PRIMARY_MIN_PT } from "@/shared/canvas/legibility";
import { DataSummary, SheetSidebar } from "@/shared/canvas/SheetSidebar";
import { escapeHtml, htmlToText } from "@/shared/canvas/sheetText";
import { CanvasThemeId, getCanvasTheme } from "@/shared/canvas/themes";
import { VersionSwitch } from "@/shared/canvas/ToolVersion";
import { clearSheetParam, useSheetLoader } from "@/shared/canvas/useSheetLoader";
import { SidebarWarning } from "@/shared/components/SidebarLayout";
import { Label } from "@/shared/components/ui/label";
import { warmImageCache } from "@/shared/utils/imageDataUrl";
import { ListEditor, ListEditTarget } from "./components/ListEditor";
import { LegibilityReport, TileCanvas } from "./components/TileCanvas";
import { DEFAULT_SIZE, EXAMPLES, PRESETS, SIZES, TopListSizeId } from "./constants";
import { Layout, ListItem, ListView, parseSheet } from "./utils/parseSheet";

const EXPORT_AREA_ID = "top-list-export-area";
const DEFAULT_TITLE = "<b>Top List</b>";
const DEFAULT_DATE = "<b>By Massive</b>";

interface LoadedSummary extends Omit<DataSummary, "headline" | "notes"> {
  layout: Layout;
}

export default function App() {
  // The list's data, as loaded and then edited on the canvas (with undo).
  const history = useEditHistory<ListItem[]>([]);
  const items = history.value;
  const confirmDiscard = useDiscardGuard(history.dirty);
  // The open click-to-edit popover: what it edits and where it's anchored.
  const [editing, setEditing] = useState<{ target: ListEditTarget; anchor: HTMLElement } | null>(null);
  const [layout, setLayout] = useState<Layout>("grid");
  // List rows or tiles; picked in the sidebar and kept across loads.
  const [view, setView] = useState<ListView>("list");
  const [symbol, setSymbol] = useState("$");
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [date, setDate] = useState(DEFAULT_DATE);
  const [size, setSize] = useState<TopListSizeId>(DEFAULT_SIZE);
  const [theme, setTheme] = useState<CanvasThemeId>("light");
  const [showPresentedBy, setShowPresentedBy] = useState(true);
  const [summary, setSummary] = useState<LoadedSummary | null>(null);
  const [atMinimum, setAtMinimum] = useState(0);
  const [legibility, setLegibility] = useState<LegibilityReport | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const { width: canvasW, height: canvasH, label: sizeLabel } = SIZES.find((s) => s.id === size)!;
  const preset = PRESETS[size];
  // The smallest text that still reads once a feed shrinks the image on a phone.
  // Memoised: TileCanvas lays out again whenever it changes.
  const legible = useMemo(() => legibleSizes(canvasW), [canvasW]);
  const logoUrls = useMemo(() => items.map((i) => i.logoUrl), [items]);
  const logoSources = useMemo(() => ({ logoDevToken: logoDevTokenFrom(logoUrls) }), [logoUrls]);

  // Convert logos ahead (on load and after edits), so Download JPG doesn't wait for them.
  useEffect(() => warmImageCache(logoUrls.filter((u) => u !== INITIALS)), [logoUrls]);

  const loadText = useCallback((text: string, delimiter: string | undefined, source: string) => {
    const sheet = parseSheet(text, delimiter);
    if (sheet.items.length === 0) {
      toast.error("No companies found. The sheet needs name and logo columns.");
      history.load([]);
      setSummary({ layout: sheet.layout, count: 0, skipped: sheet.skipped, duplicateNames: [] });
      return;
    }
    setEditing(null);
    history.load(sheet.items);
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
    // history.load is stable.
  }, []);

  // Also loads ?e=<sheet> on open (the dashboard's "Open in editor", and old /bento-map links).
  const loadSheet = useSheetLoader(loadText);
  const loadFirstExample = () => loadSheet(EXAMPLES[0].url, EXAMPLES[0].label);

  // Loading another sheet or unloading throws edits away: ask first.
  const guardedLoadText: typeof loadText = (...args) => {
    if (confirmDiscard()) loadText(...args);
  };
  const guardedLoadSheet: typeof loadSheet = async (...args) => {
    if (confirmDiscard()) await loadSheet(...args);
  };

  const unloadList = () => {
    if (!confirmDiscard()) return;
    setEditing(null);
    history.load([]);
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
    setEditing(null);
    setIsExporting(true);
    try {
      // Logos still being looked up would be captured half-way (the sheet's broken one).
      await whenLogosSettled();
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

  // Sheet columns parseSheet reads back; "Name · description" splits again on load,
  // and the logo is the one each company actually shows.
  const sheetRows = () =>
    items.map((i) => [
      String(i.rank),
      i.description ? `${i.name} · ${i.description}` : i.name,
      resolvedLogoSync(i.logoUrl, i.website, logoSources.logoDevToken),
      i.valueText ?? i.valueLabel ?? (i.value !== undefined ? String(i.value) : ""),
      i.website ?? "",
    ]);
  const sheetTsv = (rows: string[][]) =>
    toSheetTsv({ title, date, header: ["position", "company", "logo", "value", "url"], rows });

  // What didn't fit at a phone-readable size; shown above Download.
  const tip = size === "vertical" ? "Try fewer companies." : "Try Vertical, or fewer companies.";
  const legibilityWarning = items.length > 0 && legibility && (legibility.shrunkNames > 0 || legibility.logoOnly > 0) && (
    <SidebarWarning>
      {legibility.shrunkNames > 0 ? (
        <p>
          Too many companies to stay readable on a phone: names are about{" "}
          {phonePt(legibility.smallestName, canvasW).toFixed(1)}pt (readable from {PRIMARY_MIN_PT}pt). {tip}
        </p>
      ) : (
        <p>
          {legibility.logoOnly} {legibility.logoOnly === 1 ? "company shows" : "companies show"} only the logo: not
          enough room for a name that reads on a phone. {tip}
        </p>
      )}
    </SidebarWarning>
  );

  const sidebarSummary: DataSummary | null = summary && {
    ...summary,
    // Live count, so it follows edits.
    headline: `${items.length} companies · ${
      view === "list"
        ? summary.layout === "bento"
          ? "List, ranked by value"
          : "List, in rank order"
        : summary.layout === "bento"
          ? "Bento, sized by value"
          : "Grid, equal tiles in rank order"
    }`,
    notes:
      atMinimum > 0
        ? [`${atMinimum} shown at minimum size, so they are larger than their value (not to scale).`]
        : undefined,
  };

  return (
    // The sheet's Logo.dev key lets companies without a working logo be looked up there too.
    <LogoSourcesProvider value={logoSources}>
      <Toaster position="top-center" richColors />
      <SheetSidebar
        toolName="Top List"
        versionSwitch={<VersionSwitch confirmLeave={confirmDiscard} />}
        sizes={SIZES}
        size={size}
        onSizeChange={setSize}
        theme={theme}
        onThemeChange={setTheme}
        showPresentedBy={showPresentedBy}
        onShowPresentedByChange={setShowPresentedBy}
        designExtra={
          <div className="space-y-2">
            <Label className="text-xs font-medium text-text-dim uppercase tracking-wide">Layout</Label>
            <Segmented
              options={[
                { id: "list" as const, label: "List", icon: ListNumbers },
                { id: "grid" as const, label: "Grid", icon: SquaresFour },
              ]}
              value={view}
              onChange={setView}
            />
          </div>
        }
        summary={sidebarSummary}
        editPanel={
          <EditPanel
            hint="Click a tile to edit it."
            dirty={history.dirty}
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            onUndo={history.undo}
            onRedo={history.redo}
            onReset={history.reset}
            addLabel="Add company"
            onAdd={(anchor) => setEditing({ target: { kind: "new" }, anchor })}
            onDownloadTsv={() => {
              const rows = sheetRows();
              downloadSheetTsv(htmlToText(title) || "Top List", sheetTsv(rows), rows, 1);
            }}
            onCopyTsv={() => {
              const rows = sheetRows();
              void copySheetTsv(sheetTsv(rows), rows, 1);
            }}
          />
        }
        columnsHint={
          <>
            Columns: <span className="font-mono">name</span>, <span className="font-mono">logo</span>, and
            optionally <span className="font-mono">position</span>. Add a <span className="font-mono">value</span>{" "}
            column (4.2T, 91.5B, ~$361M) to switch to the Bento layout, sized by value.
          </>
        }
        examples={EXAMPLES}
        onLoadText={guardedLoadText}
        onLoadSheet={guardedLoadSheet}
        onUnload={unloadList}
        onExportJpg={handleExportJpg}
        isExporting={isExporting}
        exportProgress={exportProgress}
        logoUrls={logoUrls}
        warnings={legibilityWarning || undefined}
      >
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
            view={view}
            layout={layout}
            items={items}
            symbol={symbol}
            minTileSide={preset.minTileSide}
            legible={legible}
            onLegibilityChange={setLegibility}
            tileGap={preset.tileGap}
            onMinimumCountChange={setAtMinimum}
            onEdit={isExporting ? undefined : (id, anchor) => setEditing({ target: { kind: "item", id }, anchor })}
          />
        </CanvasFrame>
        <EditPopover anchor={editing?.anchor ?? null} onCancel={() => setEditing(null)}>
          {editing && (
            <ListEditor
              // A fresh form (and draft) for each target.
              key={JSON.stringify(editing.target)}
              target={editing.target}
              items={items}
              layout={layout}
              onCommit={history.commit}
              onClose={() => setEditing(null)}
            />
          )}
        </EditPopover>
      </SheetSidebar>
    </LogoSourcesProvider>
  );
}
