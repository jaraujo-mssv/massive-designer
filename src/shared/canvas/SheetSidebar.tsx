import { useEffect, useMemo, useState } from "react";
import { DownloadSimple, Table } from "@phosphor-icons/react";
import {
  SidebarColumn,
  SidebarLayout,
  SidebarWarning,
  sidebarButtonClass,
  sidebarHeadingClass,
  sidebarInputClass,
} from "@/shared/components/SidebarLayout";
import { isChromium, isIOS } from "@/shared/utils/browser";
import { countLogoDevUrls, LOGO_DEV_PER_MINUTE } from "@/shared/utils/logoDev";
import { Download, ExternalLink, Link, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { DesignPanel, SizeOption } from "./DesignPanel";
import type { ExportProgress } from "./exportJpg";
import type { SkippedRow } from "./sheetText";
import type { CanvasThemeId } from "./themes";

export interface Example {
  label: string;
  /** Short note shown under the name (layout, size of the sheet…). */
  hint: string;
  url: string;
}

export interface DataSummary {
  /** Number of items loaded; 0 means the last load found nothing usable. */
  count: number;
  /** First line of the Data section, e.g. "10 companies · Grid". */
  headline: string;
  /** Extra tool-specific notes, one paragraph each. */
  notes?: string[];
  skipped: SkippedRow[];
  duplicateNames: string[];
}

interface SheetSidebarProps<Size extends string> {
  toolName: string;
  sizes: SizeOption<Size>[];
  size: Size;
  onSizeChange: (size: Size) => void;
  theme: CanvasThemeId;
  onThemeChange: (theme: CanvasThemeId) => void;
  showPresentedBy: boolean;
  onShowPresentedByChange: (show: boolean) => void;
  summary: DataSummary | null;
  /** Explains the sheet's columns under the Import buttons. */
  columnsHint: React.ReactNode;
  examples: Example[];
  /** `delimiter` is undefined when it should be detected (.csv files). */
  onLoadText: (text: string, delimiter: string | undefined, source: string) => void;
  /** Fetches a Google Sheet (URL or ID) and loads it; `source` names it in the toast. */
  onLoadSheet: (urlOrId: string, source?: string) => void;
  /** Clears the loaded sheet so another can be imported. */
  onUnload: () => void;
  /** Label for the unload button, e.g. "Unload map". */
  unloadLabel?: string;
  onExportJpg: () => void;
  isExporting: boolean;
  /** Where the running export is; shown on the button with a progress bar. */
  exportProgress?: ExportProgress | null;
  /**
   * Tool-specific warnings (use SidebarWarning), shown right above Download.
   * Pass nothing when there's no warning: on phones it also puts a dot on Edit.
   */
  warnings?: React.ReactNode;
  /** The loaded sheet's logo URLs, to warn when they pass Logo.dev's rate limit. */
  logoUrls?: string[];
  /** The canvas. */
  children: React.ReactNode;
}

function exportLabel(p: ExportProgress | null | undefined): string {
  if (!p) return "Exporting...";
  if (p.step === "logos") return `Preparing logos ${p.done} / ${p.total}`;
  return "Rendering image...";
}

/**
 * Overall export progress, 0..1. Converting logos is most of the wait on a cold
 * cache, so it takes the first 70% of the bar and rendering the rest.
 */
function exportFraction(p: ExportProgress | null | undefined): number {
  if (!p || p.total === 0) return 0;
  const part = Math.min(1, p.done / p.total);
  return p.step === "logos" ? part * 0.7 : 0.7 + part * 0.3;
}

/**
 * Sidebar of the sheet-driven canvas tools, laid out around the canvas
 * (`children`) by SidebarLayout: Design panel, data summary, Import and
 * Examples (only while nothing is loaded), Unload list, and Export.
 *
 * On phones the sections move into a drawer, and Download into the bottom bar.
 */
export function SheetSidebar<Size extends string>({
  toolName,
  sizes,
  size,
  onSizeChange,
  theme,
  onThemeChange,
  showPresentedBy,
  onShowPresentedByChange,
  summary,
  columnsHint,
  examples,
  onLoadText,
  onLoadSheet,
  onUnload,
  unloadLabel = "Unload list",
  onExportJpg,
  isExporting,
  exportProgress,
  warnings,
  logoUrls,
  children,
}: SheetSidebarProps<Size>) {
  const chromium = useMemo(() => isChromium(), []);
  const ios = useMemo(() => isIOS(), []);
  const logoDevCount = useMemo(() => countLogoDevUrls(logoUrls ?? []), [logoUrls]);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  // A failed load (nothing usable) still shows its summary, but keeps Import open.
  const isLoaded = (summary?.count ?? 0) > 0;

  // Phones: close the drawer once a sheet loads, to show the result.
  useEffect(() => {
    if (isLoaded) setDrawerOpen(false);
  }, [isLoaded]);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const delimiter = file.name.toLowerCase().endsWith(".tsv") ? "\t" : undefined;
      onLoadText(reader.result as string, delimiter, file.name);
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsText(file);
  };

  const openUrlDialog = () => {
    setDrawerOpen(false);
    setShowUrlDialog(true);
  };

  const handleUrlImport = () => {
    const url = urlInput.trim();
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }
    setShowUrlDialog(false);
    setUrlInput("");
    onLoadSheet(url);
  };

  const logoDevOver = logoDevCount > LOGO_DEV_PER_MINUTE;
  const warningList = (
    <>
      {warnings}
      {logoDevOver && (
        <SidebarWarning>
          This sheet has {logoDevCount} logos from Logo.dev, which allows {LOGO_DEV_PER_MINUTE} logos per minute,
          so not all of them may be displayed. Check the preview before exporting.
        </SidebarWarning>
      )}
      {!chromium && (
        <SidebarWarning>
          {ios
            ? "On iPhone and iPad, logos and effects can render differently. For the final file, export from Chrome on a computer."
            : "For the most accurate export, use a Chrome-based browser (Chrome, Edge, Brave, Arc). Safari and Firefox can render logos and effects differently."}
        </SidebarWarning>
      )}
    </>
  );

  const sections = (
    <>
      <DesignPanel
        sizes={sizes}
        size={size}
        onSizeChange={onSizeChange}
        theme={theme}
        onThemeChange={onThemeChange}
        showPresentedBy={showPresentedBy}
        onShowPresentedByChange={onShowPresentedByChange}
      />

      {summary && (
        <div className="p-4 space-y-2 border-b border-border-subtle text-xs text-text-dim">
          <h3 className={sidebarHeadingClass}>Data</h3>
          <p className="text-sm text-text-primary">{summary.headline}</p>
          {summary.notes?.map((note) => <p key={note}>{note}</p>)}
          {summary.duplicateNames.length > 0 && <p>Listed more than once: {summary.duplicateNames.join(", ")}</p>}
          {summary.skipped.length > 0 && (
            <div>
              <p>{summary.skipped.length} rows skipped:</p>
              <ul className="mt-1 space-y-0.5 list-disc pl-4">
                {summary.skipped.map((s) => (
                  <li key={s.row}>
                    Row {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isLoaded && (
            <button onClick={onUnload} className={`${sidebarButtonClass} mt-3`}>
              <X className="w-4 h-4" />
              {unloadLabel}
            </button>
          )}
        </div>
      )}

      {/* Import and examples only while nothing is loaded; unloading brings them back. */}
      {!isLoaded && (
        <div className="p-4 space-y-2">
          <h3 className={`${sidebarHeadingClass} mb-3`}>Import</h3>
          <label className={`${sidebarButtonClass} cursor-pointer`}>
            <Upload className="w-4 h-4" />
            Import CSV / TSV
            <input type="file" accept=".csv,.tsv" onChange={handleFile} className="hidden" />
          </label>
          <button onClick={openUrlDialog} className={sidebarButtonClass}>
            <Link className="w-4 h-4" />
            Import from Google Sheets
          </button>
          <p className="text-xs text-text-dim pt-1">{columnsHint}</p>

          <h3 className={`${sidebarHeadingClass} pt-4 mb-2`}>Examples</h3>
          <div className="space-y-1.5">
            {examples.map((ex) => (
              <div
                key={ex.url}
                className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{ex.label}</p>
                  <p className="text-[11px] text-text-dim">{ex.hint}</p>
                </div>
                <button
                  onClick={() => onLoadSheet(ex.url, ex.label)}
                  className="px-2.5 py-1 text-xs font-medium bg-brand text-white rounded-md hover:opacity-90 transition-opacity"
                >
                  Load
                </button>
                <a
                  href={ex.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open the spreadsheet"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-text-dim border border-border-subtle rounded-md hover:text-text-primary hover:border-brand transition-colors"
                >
                  Open
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const fraction = exportFraction(exportProgress);

  const desktopExport = (
    <>
      <h3 className={`${sidebarHeadingClass} mb-3`}>Export</h3>
      {warningList}
      <button
        onClick={onExportJpg}
        disabled={isExporting || !isLoaded}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg hover:opacity-90 font-medium text-sm transition-opacity ${
          isExporting ? "cursor-wait" : "disabled:opacity-50"
        }`}
      >
        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {isExporting ? exportLabel(exportProgress) : "Download JPG"}
      </button>
      {isExporting && (
        <div
          className="h-1.5 rounded-full bg-surface-2 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fraction * 100)}
        >
          <div
            className="h-full bg-brand transition-[width] duration-200"
            style={{ width: `${Math.max(3, fraction * 100)}%` }}
          />
        </div>
      )}
    </>
  );

  // Phones: the progress fills the button itself, there's no room for a separate bar.
  const mobileDownload = (
    <button
      onClick={onExportJpg}
      disabled={isExporting || !isLoaded}
      className={`relative w-full overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg font-medium text-sm ${
        isExporting ? "cursor-wait" : "disabled:opacity-50"
      }`}
    >
      {isExporting && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-200"
          style={{ width: `${Math.max(3, fraction * 100)}%` }}
        />
      )}
      <span className="relative flex items-center gap-2 min-w-0">
        {isExporting ? <Loader2 size={16} className="animate-spin shrink-0" /> : <DownloadSimple size={16} weight="bold" />}
        <span className="truncate">{isExporting ? exportLabel(exportProgress) : "Download JPG"}</span>
      </span>
    </button>
  );

  return (
    <>
      <SidebarLayout
        sidebar={
          <SidebarColumn toolName={toolName} footer={desktopExport}>
            {sections}
          </SidebarColumn>
        }
        drawerTitle={toolName}
        drawerContent={
          <>
            <div className="p-4 space-y-2 border-b border-border-subtle empty:hidden">{warningList}</div>
            {sections}
          </>
        }
        drawerOpen={drawerOpen}
        onDrawerOpenChange={setDrawerOpen}
        editLabel={isLoaded ? "Edit" : "Import"}
        editIcon={isLoaded ? undefined : Table}
        attention={Boolean(warnings) || logoDevOver}
        barAction={mobileDownload}
      >
        {children}
      </SidebarLayout>

      {showUrlDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowUrlDialog(false)}>
          <div
            className="bg-surface border border-border-subtle rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-text-primary mb-4">Import from Google Sheets</h3>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlImport()}
              placeholder="Paste a Google Sheets URL or ID"
              className={`${sidebarInputClass} mb-2`}
              autoFocus
            />
            <p className="text-xs text-text-dim mb-4">The sheet must be shared as "Anyone with the link can view".</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowUrlDialog(false);
                  setUrlInput("");
                }}
                className="px-4 py-2 text-sm text-text-dim hover:text-text-primary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUrlImport}
                className="px-4 py-2 bg-brand text-white text-sm rounded-lg hover:opacity-90 font-medium transition-opacity"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
