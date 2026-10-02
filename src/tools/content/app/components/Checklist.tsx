import { Check } from "@phosphor-icons/react";
import { useContentWrite } from "../hooks/useContentWrite";
import type { ChecklistItem, ContentDoc } from "../types";
import { progress } from "../utils/checklist";
import { Markdown } from "./Markdown";

export function ProgressBar({ done, total, className = "" }: { done: number; total: number; className?: string }) {
  return (
    <div className={`h-1 overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <div
        className={`h-full rounded-full transition-all ${done === total && total > 0 ? "bg-emerald-400" : "bg-brand"}`}
        style={{ width: total ? `${(done / total) * 100}%` : 0 }}
      />
    </div>
  );
}

/** One box. Clickable on the dev server, where it writes the tick to the file. */
export function CheckItem({ doc, item, children }: { doc: ContentDoc; item: ChecklistItem; children?: React.ReactNode }) {
  const { canWrite, toggle, isPending } = useContentWrite();
  return (
    <label
      className={`flex items-start gap-2.5 rounded-md px-2 py-1.5 text-sm ${canWrite ? "cursor-pointer hover:bg-surface-2" : ""} ${
        isPending(doc, item) ? "opacity-50" : ""
      }`}
      style={{ paddingLeft: 8 + item.depth * 20 }}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={item.checked}
        disabled={!canWrite}
        onChange={() => toggle(doc, item)}
      />
      <span
        aria-hidden
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 ${
          item.checked ? "border-emerald-400 bg-emerald-400 text-bg" : "border-border-hov"
        }`}
      >
        {item.checked && <Check size={11} weight="bold" />}
      </span>
      <span className={`min-w-0 flex-1 ${item.checked ? "text-text-dim line-through decoration-text-dim/50" : "text-text-mid"}`}>
        {children ?? <Markdown className="[&_p]:text-inherit">{item.label}</Markdown>}
      </span>
    </label>
  );
}

/** A doc's `## Checklist` (or any list of items), with its progress. */
export function Checklist({ doc, items, title = "Checklist" }: { doc: ContentDoc; items: ChecklistItem[]; title?: string }) {
  if (!items.length) return null;
  const { done, total } = progress(items);
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 md:p-5">
      <div className="mb-2 flex items-center gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-dim">{title}</h3>
        <span className="font-mono text-[11px] text-text-dim">
          {done}/{total}
        </span>
        <ProgressBar done={done} total={total} className="flex-1" />
      </div>
      <div className="-mx-2">
        {items.map((item) => (
          <CheckItem key={item.line} doc={doc} item={item} />
        ))}
      </div>
    </section>
  );
}
