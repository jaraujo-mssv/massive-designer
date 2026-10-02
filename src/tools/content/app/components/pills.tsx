import { useEffect, useRef, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { KIND, STATUS, STATUS_IDS } from "../constants";
import type { ContentDoc, DocKind, DocStatus } from "../types";
import { useContentWrite } from "../hooks/useContentWrite";

export function StatusPill({ status }: { status: DocStatus }) {
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] ${STATUS[status].className}`}>
      {STATUS[status].label}
    </span>
  );
}

export function KindIcon({ kind, size = 14 }: { kind: DocKind; size?: number }) {
  const { Icon, className } = KIND[kind];
  return <Icon size={size} weight="fill" className={`shrink-0 ${className}`} />;
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full border border-border-subtle px-2 py-0.5 font-mono text-[10px] text-text-dim">
      {children}
    </span>
  );
}

/** The status pill; on the dev server it opens a menu that writes `status:` to the file. */
export function StatusControl({ doc }: { doc: ContentDoc }) {
  const { canWrite, setStatus, isPending } = useContentWrite();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!canWrite) return <StatusPill status={doc.status} />;

  return (
    <div ref={root} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Change status"
        className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-opacity ${
          STATUS[doc.status].className
        } ${isPending(doc) ? "opacity-50" : ""}`}
      >
        {STATUS[doc.status].label}
        <CaretDown size={9} weight="bold" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-30 mt-1 min-w-36 rounded-lg border border-border-subtle bg-surface-2 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          {STATUS_IDS.map((s) => (
            <li key={s}>
              <button
                role="option"
                aria-selected={s === doc.status}
                onClick={() => {
                  setOpen(false);
                  if (s !== doc.status) setStatus(doc, s);
                }}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-surface"
              >
                <StatusPill status={s} />
                <span className="flex-1" />
                <Check size={11} className={s === doc.status ? "text-text-primary" : "invisible"} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
