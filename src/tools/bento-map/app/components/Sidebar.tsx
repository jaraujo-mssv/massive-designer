import { useState } from "react";
import { Download, ExternalLink, FileSpreadsheet, Link, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { DesignPanel } from "@/shared/canvas/DesignPanel";
import type { CanvasThemeId } from "@/shared/canvas/themes";
import { BENTO_SIZES, BentoSizeId, TEMPLATE_SHEET_URL } from "../constants";
import type { SkippedRow } from "../utils/parseSheet";

export interface DataSummary {
  count: number;
  skipped: SkippedRow[];
  duplicateNames: string[];
}

interface SidebarProps {
  size: BentoSizeId;
  onSizeChange: (size: BentoSizeId) => void;
  theme: CanvasThemeId;
  onThemeChange: (theme: CanvasThemeId) => void;
  showPresentedBy: boolean;
  onShowPresentedByChange: (show: boolean) => void;
  summary: DataSummary | null;
  atMinimum: number;
  /** `delimiter` is undefined when it should be detected (.csv files). */
  onLoadText: (text: string, delimiter: string | undefined, source: string) => void;
  /** Fetches a Google Sheet (URL or ID) and loads it. */
  onLoadSheet: (urlOrId: string) => void;
  onLoadTemplate: () => void;
  onExportJpg: () => void;
  isExporting: boolean;
}

const buttonClass =
  "w-full flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border-subtle text-text-primary rounded-lg hover:border-brand hover:text-brand-light text-sm transition-colors";
const inputClass =
  "w-full px-3 py-2 border border-border-subtle rounded-lg text-sm bg-surface text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand";

export function Sidebar({
  size,
  onSizeChange,
  theme,
  onThemeChange,
  showPresentedBy,
  onShowPresentedByChange,
  summary,
  atMinimum,
  onLoadText,
  onLoadSheet,
  onLoadTemplate,
  onExportJpg,
  isExporting,
}: SidebarProps) {
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState("");

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
        <span className="text-xs font-semibold text-text-dim uppercase tracking-widest font-mono">Bento Map</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <DesignPanel
          sizes={BENTO_SIZES}
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
            <p className="text-sm text-text-primary">{summary.count} companies</p>
            {atMinimum > 0 && (
              <p>
                {atMinimum} shown at minimum size, so they are larger than their value (not to scale).
              </p>
            )}
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
          </div>
        )}

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
          <button onClick={onLoadTemplate} className={buttonClass}>
            <FileSpreadsheet className="w-4 h-4" />
            Load template
          </button>
          <a href={TEMPLATE_SHEET_URL} target="_blank" rel="noopener noreferrer" className={buttonClass}>
            <ExternalLink className="w-4 h-4" />
            Open template spreadsheet
          </a>
          <p className="text-xs text-text-dim pt-1">
            Columns: <span className="font-mono">name</span>, <span className="font-mono">logo</span>,{" "}
            <span className="font-mono">value</span>. Values can be plain numbers or shorthand like 4.2T, 91.5B,
            850M. Start with ~ for an estimate (~$361M).
          </p>
        </div>
      </div>

      <div className="border-t border-border-subtle p-4 shrink-0 space-y-2">
        <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">Export</h3>
        <button
          onClick={onExportJpg}
          disabled={isExporting || !summary?.count}
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
