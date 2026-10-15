import { useRef, useState } from "react";
import { ArrowLeft, Trash2, Upload, X } from "lucide-react";
import { sidebarInputClass } from "@/shared/components/SidebarLayout";

const labelClass = "block text-[11px] font-medium text-text-dim uppercase tracking-wide mb-1";

/** The popover's form: a heading row, the fields, then Delete and Apply. */
export function EditForm({
  title,
  onSubmit,
  onBack,
  onDelete,
  confirmDelete,
  children,
}: {
  title: string;
  /** Apply the edit; Enter and clicking away both submit. */
  onSubmit: () => void;
  onBack?: () => void;
  onDelete?: () => void;
  /** Asks for a second click before deleting, with this text. */
  confirmDelete?: string;
  children: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-center gap-2">
        {onBack && (
          <button type="button" onClick={onBack} className="text-text-dim hover:text-text-primary" title="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h4 className="text-xs font-semibold text-text-dim uppercase tracking-widest truncate">{title}</h4>
      </div>
      {children}
      <div className="flex items-center gap-2 pt-1">
        {onDelete && (
          <button
            type="button"
            onClick={() => (confirmDelete && !confirming ? setConfirming(true) : onDelete())}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirming ? confirmDelete : "Delete"}
          </button>
        )}
        <span className="flex-1" />
        <span className="text-[10px] text-text-dim font-mono">Enter ↵ · Esc</span>
        <button
          type="submit"
          className="px-3 py-1.5 text-xs font-medium bg-brand text-white rounded-md hover:opacity-90 transition-opacity"
        >
          Apply
        </button>
      </div>
    </form>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${sidebarInputClass} py-1.5 ${error ? "border-red-500/60" : ""}`}
      />
      {error && <span className="block mt-1 text-[11px] text-red-400">{error}</span>}
    </label>
  );
}

export function SelectField<V extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: { value: V; label: string }[];
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as V)}
        className={`${sidebarInputClass} py-1.5`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** A logo URL with a preview, plus Upload (kept as a data URL) and Clear. */
export function LogoField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [failed, setFailed] = useState(false);
  const uploaded = value.startsWith("data:");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFailed(false);
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <span className={labelClass}>Logo</span>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 shrink-0 rounded-md bg-white/90 border border-border-subtle flex items-center justify-center overflow-hidden">
          {value && !failed ? (
            <img src={value} alt="" className="w-7 h-7 object-contain" onError={() => setFailed(true)} />
          ) : (
            <span className="text-[10px] text-slate-500">{value ? "!" : "—"}</span>
          )}
        </div>
        <input
          value={uploaded ? "Uploaded image" : value}
          readOnly={uploaded}
          placeholder="https://…"
          onChange={(e) => {
            setFailed(false);
            onChange(e.target.value.trim());
          }}
          className={`${sidebarInputClass} py-1.5 min-w-0`}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Upload an image"
          className="shrink-0 p-2 text-text-dim border border-border-subtle rounded-md hover:text-text-primary hover:border-brand transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Clear the logo"
            className="shrink-0 p-2 text-text-dim border border-border-subtle rounded-md hover:text-text-primary hover:border-brand transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      {failed && <span className="block mt-1 text-[11px] text-amber-400">This logo doesn't load; the first letter is shown instead.</span>}
    </div>
  );
}
