import { useState } from "react";
import { Download, ExternalLink, Link, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { DesignPanel, SizeOption } from "./DesignPanel";
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
}

const buttonClass =
  "w-full flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border-subtle text-text-primary rounded-lg hover:border-brand hover:text-brand-light text-sm transition-colors";
const inputClass =
  "w-full px-3 py-2 border border-border-subtle rounded-lg text-sm bg-surface text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand";

/**
 * Sidebar of the sheet-driven canvas tools: Design panel, data summary, Import
 * and Examples (only while nothing is loaded), Unload list, and Export.
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
}: SheetSidebarProps<Size>) {
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  // A failed load (nothing usable) still shows its summary, but keeps Import open.
  const isLoaded = (summary?.count ?? 0) > 0;

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

  return (
    <div className="w-96 shrink-0 flex flex-col bg-surface border-r border-border-subtle">
      <div className="flex items-center px-4 py-3 border-b border-border-subtle shrink-0">
        <span className="text-xs font-semibold text-text-dim uppercase tracking-widest font-mono">{toolName}</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
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
            <h3 className="font-semibold uppercase tracking-widest">Data</h3>
            <p className="text-sm text-text-primary">{summary.headline}</p>
            {summary.notes?.map((note) => <p key={note}>{note}</p>)}
            {summary.duplicateNames.length > 0 && (
              <p>Listed more than once: {summary.duplicateNames.join(", ")}</p>
            )}
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
              <button onClick={onUnload} className={`${buttonClass} mt-3`}>
                <X className="w-4 h-4" />
                {unloadLabel}
              </button>
            )}
          </div>
        )}

        {/* Import and examples only while nothing is loaded; unloading brings them back. */}
        {!isLoaded && (
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">Import</h3>
            <label className={`${buttonClass} cursor-pointer`}>
              <Upload className="w-4 h-4" />
              Import CSV / TSV
              <input type="file" accept=".csv,.tsv" onChange={handleFile} className="hidden" />
            </label>
            <button onClick={() => setShowUrlDialog(true)} className={buttonClass}>
              <Link className="w-4 h-4" />
              Import from Google Sheets
            </button>
            <p className="text-xs text-text-dim pt-1">{columnsHint}</p>

            <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest pt-4 mb-2">Examples</h3>
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
      </div>

      <div className="border-t border-border-subtle p-4 shrink-0 space-y-2">
        <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">Export</h3>
        <button
          onClick={onExportJpg}
          disabled={isExporting || !isLoaded}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50 text-sm transition-opacity"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {isExporting ? "Exporting..." : "Download JPG"}
        </button>
      </div>

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
              className={`${inputClass} mb-2`}
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
    </div>
  );
}
