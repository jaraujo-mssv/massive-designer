import { SidebarWarning } from "@/shared/components/SidebarLayout";
import { PRIMARY_MIN_PT, phonePt } from "@/shared/canvas/legibility";
import type { FitMode } from "../utils/layout";
import type { FitInfo } from "./MapCanvas";

interface FitWarningProps {
  fit: FitInfo;
  fitMode: FitMode;
  onFitModeChange: (mode: FitMode) => void;
  companyCount: number;
  /** To state sizes as they appear on a phone. */
  canvasWidth: number;
  /** False when already on Vertical, the size that fits the most at a phone-readable size. */
  suggestVertical: boolean;
}

const MODES: { id: FitMode; label: string }[] = [
  { id: "shrink", label: "Shrink pills" },
  { id: "hide", label: "Hide companies" },
];

/**
 * Shown above Export when the map doesn't fit at a readable pill size: says
 * what was done about it and lets you switch between shrinking and hiding.
 */
export function FitWarning({ fit, fitMode, onFitModeChange, companyCount, canvasWidth, suggestVertical }: FitWarningProps) {
  const hiddenCount = fit.hidden.reduce((n, g) => n + g.names.length, 0);
  if (fit.readable && hiddenCount === 0) return null;

  return (
    <SidebarWarning>
      {hiddenCount > 0 ? (
        <p>
          {hiddenCount} {hiddenCount === 1 ? "company is" : "companies are"} hidden to keep pills readable on a
          phone, in {fit.hidden.length} {fit.hidden.length === 1 ? "category" : "categories"}.
          {suggestVertical && " Try Vertical to fit more."}
        </p>
      ) : (
        <p>
          {companyCount} companies don't fit at a phone-readable size, so names are about{" "}
          {phonePt(fit.fontSize, canvasWidth).toFixed(1)}pt on a phone (readable from {PRIMARY_MIN_PT}pt).{" "}
          {suggestVertical ? "Try Vertical, or hide some companies." : "Hide some companies, or split the map."}
        </p>
      )}

      <div className="flex rounded-md border border-amber-500/30 overflow-hidden">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onFitModeChange(m.id)}
            className={`flex-1 px-2 py-1 text-[11px] font-medium transition-colors ${
              fitMode === m.id ? "bg-amber-500/25 text-amber-100" : "text-amber-200/70 hover:text-amber-100"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {hiddenCount > 0 && (
        <details>
          <summary className="cursor-pointer text-amber-200/80">Show hidden companies</summary>
          <ul className="mt-1 space-y-1">
            {fit.hidden.map((g) => (
              <li key={g.category}>
                <span className="text-amber-100">{g.category}:</span> {g.names.join(", ")}
              </li>
            ))}
          </ul>
        </details>
      )}
    </SidebarWarning>
  );
}
