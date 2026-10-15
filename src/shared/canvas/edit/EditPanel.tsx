import { Copy, FileDown, Plus, Redo2, RotateCcw, Undo2 } from "lucide-react";
import { sidebarButtonClass, sidebarHeadingClass } from "@/shared/components/SidebarLayout";

const smallButtonClass =
  "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-text-dim bg-surface-2 border border-border-subtle rounded-md hover:text-text-primary hover:border-brand transition-colors disabled:opacity-40 disabled:pointer-events-none";

/** The sidebar's Edit section: how to edit, history, Add, and saving edits as a sheet. */
export function EditPanel({
  hint,
  dirty,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  addLabel,
  onAdd,
  onDownloadTsv,
  onCopyTsv,
}: {
  hint: string;
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  addLabel: string;
  /** Gets the button, to anchor the Add popover on it. */
  onAdd: (button: HTMLElement) => void;
  onDownloadTsv: () => void;
  onCopyTsv: () => void;
}) {
  return (
    <div className="p-4 space-y-2 border-b border-border-subtle text-xs text-text-dim">
      <h3 className={sidebarHeadingClass}>Edit</h3>
      <p>{hint}</p>
      <div className="flex gap-1.5">
        <button onClick={onUndo} disabled={!canUndo} className={smallButtonClass} title="Undo (⌘Z)">
          <Undo2 className="w-3.5 h-3.5" />
          Undo
        </button>
        <button onClick={onRedo} disabled={!canRedo} className={smallButtonClass} title="Redo (⇧⌘Z)">
          <Redo2 className="w-3.5 h-3.5" />
          Redo
        </button>
        <button onClick={onReset} disabled={!dirty} className={smallButtonClass} title="Back to the loaded sheet">
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
      <button onClick={(e) => onAdd(e.currentTarget)} className={sidebarButtonClass}>
        <Plus className="w-4 h-4" />
        {addLabel}
      </button>
      {dirty && <p className="pt-1 text-amber-300/90">Edited. Save the edits as a sheet to keep them.</p>}
      <div className="flex gap-1.5">
        <button onClick={onDownloadTsv} className={smallButtonClass} title="Download as a .tsv to import later">
          <FileDown className="w-3.5 h-3.5" />
          Download TSV
        </button>
        <button onClick={onCopyTsv} className={smallButtonClass} title="Copy to paste into a Google Sheet">
          <Copy className="w-3.5 h-3.5" />
          Copy for Sheets
        </button>
      </div>
    </div>
  );
}
