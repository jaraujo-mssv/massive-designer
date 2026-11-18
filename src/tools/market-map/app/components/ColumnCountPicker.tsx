import { useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

const stepButtonClass =
  "flex items-center justify-center w-8 h-8 text-text-dim hover:text-text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none";

interface ColumnCountPickerProps {
  /** The count picked by hand, or null for automatic. */
  value: number | null;
  /** The count the automatic layout chose, shown while automatic. */
  autoValue?: number;
  /** The sheet's `__COLUMNS__`: where the first step goes. */
  sheetValue?: number;
  /** One column per category, up to MAX_COLUMNS. */
  max: number;
  onChange: (value: number | null) => void;
}

/**
 * Columns view: the number of columns, on one line. Automatic until touched.
 * The first −/+ (or arrow key) goes to the sheet's `__COLUMNS__`, unless the
 * map already has that many, and then steps by one; typing sets a count
 * directly. The reset icon goes back to automatic.
 */
export function ColumnCountPicker({ value, autoValue, sheetValue, max, onChange }: ColumnCountPickerProps) {
  // What's typed, while the field has focus; null shows the current count.
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(1, n));
  const shown = value ?? autoValue;
  const isAuto = value === null;

  const next = (delta: number) => {
    if (isAuto && sheetValue && clamp(sheetValue) !== autoValue) return clamp(sheetValue);
    return shown === undefined ? null : clamp(shown + delta);
  };
  const step = (delta: number) => {
    const n = next(delta);
    if (n !== null) onChange(n);
    setDraft(null);
  };
  const canStep = (delta: number) => {
    const n = next(delta);
    return n !== null && (isAuto || n !== value);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-xs text-text-dim">
        Columns{isAuto && <span className="ml-1.5 text-text-dim/70">· Auto</span>}
      </span>
      <div className="flex items-center bg-surface-2 rounded-lg border border-border-subtle overflow-hidden focus-within:border-brand">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!canStep(-1)}
          className={stepButtonClass}
          aria-label="Fewer columns"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          aria-label="Columns"
          value={draft ?? (shown !== undefined ? String(shown) : "")}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const text = e.target.value.replace(/\D/g, "");
            setDraft(text);
            if (text) onChange(clamp(Number(text)));
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              if (canStep(e.key === "ArrowUp" ? 1 : -1)) step(e.key === "ArrowUp" ? 1 : -1);
            } else if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className={`w-8 h-8 bg-transparent text-center text-sm tabular-nums focus:outline-none ${
            isAuto && draft === null ? "text-text-dim" : "text-text-primary"
          }`}
        />
        <button
          type="button"
          onClick={() => step(1)}
          disabled={!canStep(1)}
          className={stepButtonClass}
          aria-label="More columns"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          onChange(null);
          setDraft(null);
        }}
        disabled={isAuto}
        className={`${stepButtonClass} rounded-lg border border-border-subtle bg-surface-2 hover:border-brand`}
        title="Back to automatic"
        aria-label="Back to automatic columns"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
