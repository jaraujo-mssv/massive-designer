import React from 'react';

/**
 * The control primitives, matching the upstream tuner's set one for one — a
 * labelled slider with a number box, a segmented picker, a toggle, and a colour
 * well. Anything the tuner can express, this can express.
 */

export function Group({
  title,
  children,
  enabled,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  /** Present only for the optional live groups, which can be off entirely. */
  enabled?: boolean;
  onToggle?: (next: boolean) => void;
}) {
  const collapsed = enabled === false;
  return (
    <div className="border-b border-border-subtle">
      <div className="flex items-center justify-between px-5 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">{title}</h3>
        {onToggle && (
          <button
            type="button"
            onClick={() => onToggle(collapsed)}
            aria-pressed={!collapsed}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              collapsed
                ? 'bg-surface-2 text-text-dim hover:text-text-primary'
                : 'bg-brand text-white'
            }`}
          >
            {collapsed ? 'Off' : 'On'}
          </button>
        )}
      </div>
      {!collapsed && <div className="px-5 pb-4 flex flex-col gap-2">{children}</div>}
    </div>
  );
}

export function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-24 shrink-0 text-xs text-text-mid">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-brand"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isNaN(next)) onChange(next);
        }}
        className="w-16 shrink-0 bg-surface-2 border border-border-subtle rounded px-2 py-1 text-xs text-text-primary"
      />
    </div>
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-24 shrink-0 text-xs text-text-mid">{label}</label>
      <div className="flex-1 flex rounded border border-border-subtle overflow-hidden">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 px-2 py-1 text-xs transition-colors ${
              option.value === value
                ? 'bg-brand text-white'
                : 'bg-surface-2 text-text-dim hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <span className="w-24 shrink-0 text-xs text-text-mid">{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-brand w-4 h-4"
      />
    </label>
  );
}

export function ColorWell({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-24 shrink-0 text-xs text-text-mid">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-7 bg-transparent border border-border-subtle rounded cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-surface-2 border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary"
      />
    </div>
  );
}
