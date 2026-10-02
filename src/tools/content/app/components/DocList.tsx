import { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlass, SquaresFour, X } from "@phosphor-icons/react";
import { sidebarHeadingClass } from "@/shared/components/SidebarLayout";
import { KIND, KIND_IDS, STATUS, STATUS_IDS } from "../constants";
import type { Campaign, ContentDoc, DocKind, DocStatus } from "../types";
import { progress } from "../utils/checklist";
import { KindIcon, StatusPill } from "./pills";

const selectClass =
  "min-w-0 flex-1 rounded-lg border border-border-subtle bg-surface-2 px-2 py-1.5 font-mono text-[11px] text-text-primary outline-none focus:border-brand";

/** Whether a doc is about this legend: the legend itself, or a script they're in. */
const isAbout = (doc: ContentDoc, legend: string) =>
  (doc.kind === "legend" && doc.id === legend) || (doc.kind === "script" && doc.legends.includes(legend));

export function DocList({
  campaign,
  campaigns,
  selectedKey,
  onSelect,
  onCampaign,
}: {
  campaign: Campaign;
  campaigns: Campaign[];
  /** The open doc, or null on the campaign overview. */
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onCampaign: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<DocKind | "all">("all");
  const [legend, setLegend] = useState<string>("all");
  const [status, setStatus] = useState<DocStatus | "all">("all");
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const docs = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return campaign.docs.filter((d) => {
      if (kind !== "all" && d.kind !== kind) return false;
      if (status !== "all" && d.status !== status) return false;
      if (legend !== "all" && !isAbout(d, legend)) return false;
      const text = `${d.title} ${d.id} ${d.raw}`.toLowerCase();
      return terms.every((t) => text.includes(t));
    });
  }, [campaign, query, kind, legend, status]);

  const kinds = KIND_IDS.filter((k) => campaign.docs.some((d) => d.kind === k));
  const filtered = query || kind !== "all" || legend !== "all" || status !== "all";
  const reset = () => {
    setQuery("");
    setKind("all");
    setLegend("all");
    setStatus("all");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-2 border-b border-border-subtle p-3">
        {campaigns.length > 1 && (
          <select value={campaign.id} onChange={(e) => onCampaign(e.target.value)} aria-label="Campaign" className={`${selectClass} w-full`}>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-2 px-2.5 py-1.5 focus-within:border-brand/50">
          <MagnifyingGlass size={14} className="shrink-0 text-text-dim" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQuery("");
                e.currentTarget.blur();
              }
            }}
            placeholder="Search scripts, lines, notes"
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-dim"
          />
          {query ? (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="text-text-dim hover:text-text-primary">
              <X size={14} />
            </button>
          ) : (
            <kbd className="rounded border border-border-subtle px-1 font-mono text-[10px] text-text-dim">/</kbd>
          )}
        </label>
        <div className="flex flex-wrap gap-1">
          {(["all", ...kinds] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors ${
                kind === k ? "bg-surface-2 text-brand-light" : "text-text-dim hover:text-text-primary"
              }`}
            >
              {k !== "all" && <KindIcon kind={k} size={12} />}
              {k === "all" ? "All" : KIND[k].plural}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {campaign.legends.length > 0 && (
            <select value={legend} onChange={(e) => setLegend(e.target.value)} aria-label="Filter by legend" className={selectClass}>
              <option value="all">All legends</option>
              {campaign.legends.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.short}
                </option>
              ))}
            </select>
          )}
          <select value={status} onChange={(e) => setStatus(e.target.value as DocStatus | "all")} aria-label="Filter by status" className={selectClass}>
            <option value="all">Any status</option>
            {STATUS_IDS.map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <button
          onClick={() => onSelect(null)}
          className={`mb-1 flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors ${
            selectedKey === null ? "border-brand/30 bg-surface-2" : "border-transparent hover:bg-surface-2"
          }`}
        >
          <SquaresFour size={14} weight="fill" className={selectedKey === null ? "text-brand-light" : "text-text-dim"} />
          <span className="text-sm text-text-primary">Overview</span>
        </button>

        {docs.length === 0 && (
          <p className="px-3 py-6 text-sm text-text-dim">
            Nothing matches.{" "}
            <button onClick={reset} className="text-brand-light hover:underline">
              Show all
            </button>
          </p>
        )}

        {kinds.map((k) => {
          const group = docs.filter((d) => d.kind === k);
          if (!group.length) return null;
          return (
            <div key={k} className="pb-2">
              <h3 className={`${sidebarHeadingClass} flex items-center gap-1.5 px-2.5 pb-1 pt-3 text-[11px]`}>
                <KindIcon kind={k} size={12} />
                {KIND[k].plural}
              </h3>
              {group.map((d) => {
                const { done, total } = progress(d.checklist);
                const active = d.key === selectedKey;
                return (
                  <button
                    key={d.key}
                    onClick={() => onSelect(d.key)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                      active ? "border-brand/30 bg-surface-2" : "border-transparent hover:bg-surface-2"
                    } ${d.status === "archived" && !active ? "opacity-50" : ""}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text-primary">{d.title}</span>
                      {(d.week !== null || total > 0) && (
                        <span className="block font-mono text-[10px] text-text-dim">
                          {[d.week !== null && `Week ${d.week}`, total > 0 && `${done}/${total} done`].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                    <StatusPill status={d.status} />
                  </button>
                );
              })}
            </div>
          );
        })}
        {filtered && docs.length > 0 && (
          <button onClick={reset} className="px-2.5 py-2 font-mono text-[11px] text-text-dim hover:text-text-primary">
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
