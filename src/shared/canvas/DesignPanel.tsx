import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { CANVAS_THEMES, CanvasThemeId } from "./themes";

export interface SizeOption<T extends string> {
  id: T;
  label: string;
  width: number;
  height: number;
}

interface DesignPanelProps<T extends string> {
  sizes: SizeOption<T>[];
  size: T;
  onSizeChange: (size: T) => void;
  theme: CanvasThemeId;
  onThemeChange: (theme: CanvasThemeId) => void;
  showPresentedBy: boolean;
  onShowPresentedByChange: (show: boolean) => void;
  children?: React.ReactNode;
}

function Segmented<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: V; label: string; hint?: string }[];
  value: V;
  onChange: (value: V) => void;
}) {
  return (
    <div className="flex bg-surface-2 rounded-lg border border-border-subtle overflow-hidden">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 flex flex-col items-center px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o.id ? "bg-brand text-white" : "text-text-dim hover:text-text-primary"
          }`}
        >
          {o.label}
          {o.hint && <span className="text-[10px] font-mono opacity-70">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

/** The one place a canvas tool's design is edited: size, theme, Presented by. */
export function DesignPanel<T extends string>({
  sizes,
  size,
  onSizeChange,
  theme,
  onThemeChange,
  showPresentedBy,
  onShowPresentedByChange,
  children,
}: DesignPanelProps<T>) {
  return (
    <div className="p-4 space-y-4 border-b border-border-subtle">
      <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest">Design</h3>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-text-dim uppercase tracking-wide">Size</Label>
        <Segmented
          options={sizes.map((s) => ({ id: s.id, label: s.label, hint: `${s.width}×${s.height}` }))}
          value={size}
          onChange={onSizeChange}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-text-dim uppercase tracking-wide">Theme</Label>
        <Segmented options={CANVAS_THEMES} value={theme} onChange={onThemeChange} />
      </div>

      <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border-subtle">
        <Label className="text-sm text-text-primary">Show Presented By Logo</Label>
        <Switch checked={showPresentedBy} onCheckedChange={onShowPresentedByChange} />
      </div>

      {children}
    </div>
  );
}
