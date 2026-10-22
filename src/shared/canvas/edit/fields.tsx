import { useId, useState } from "react";
import { LinkedinLogo, XLogo } from "@phosphor-icons/react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { sidebarInputClass } from "@/shared/components/SidebarLayout";

const labelClass = "block text-[11px] font-medium text-text-dim uppercase tracking-wide mb-1";

/** An icon link at the end of a field, opened in a new tab (the website, a search for the name…). */
export interface FieldLink {
  href: string;
  title: string;
  icon: React.ReactNode;
}

/** Links to look a company up by name on LinkedIn and X; none while the name is empty. */
export function companySearchLinks(name: string): FieldLink[] {
  const q = encodeURIComponent(name.trim());
  if (!q) return [];
  return [
    {
      href: `https://www.linkedin.com/search/results/companies/?keywords=${q}`,
      title: "Search on LinkedIn",
      icon: <LinkedinLogo size={14} weight="fill" />,
    },
    { href: `https://x.com/search?q=${q}&f=user`, title: "Search on X", icon: <XLogo size={14} weight="bold" /> },
  ];
}

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
  links = [],
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  type?: "text" | "number";
  /** Icon links inside the field's right end. */
  links?: FieldLink[];
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${sidebarInputClass} py-1.5 ${error ? "border-red-500/60" : ""}`}
          // Room for the links, so text doesn't run under them.
          style={links.length ? { paddingRight: 8 + links.length * 26 } : undefined}
        />
        {links.length > 0 && (
          <div className="absolute inset-y-0 right-1.5 flex items-center gap-0.5">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                title={l.title}
                aria-label={l.title}
                className="size-6 flex items-center justify-center rounded text-text-dim hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                {l.icon}
              </a>
            ))}
          </div>
        )}
      </div>
      {error && <span className="block mt-1 text-[11px] text-red-400">{error}</span>}
    </div>
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
