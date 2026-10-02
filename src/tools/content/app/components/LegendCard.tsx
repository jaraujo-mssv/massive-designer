import { Crown } from "@phosphor-icons/react";
import type { LegendDoc } from "../types";
import { refUrl } from "../content";

/**
 * The legend's card as the landing page shows it: portrait, name, modern role,
 * how they earned their fame, the standard it matches and the quote.
 */
export function LegendCard({ legend, compact = false }: { legend: LegendDoc; compact?: boolean }) {
  const portrait = legend.refs[0]?.file;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface">
      {/* Portrait: the first reference image, or a placeholder until there is one. */}
      {portrait ? (
        <img src={refUrl(legend.campaign, portrait)} alt={legend.title} className="aspect-[4/5] w-full bg-surface-2 object-cover object-top" />
      ) : (
        <div className="relative flex aspect-[4/5] items-end bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(215,73,57,0.25),transparent_70%)] bg-surface-2 p-4">
          <Crown size={compact ? 28 : 40} weight="thin" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-text-dim/40" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Portrait</span>
        </div>
      )}
      <div className={`flex flex-1 flex-col gap-2 ${compact ? "p-3" : "p-5"}`}>
        <div className="flex flex-wrap gap-1">
          {legend.standards.map((s) => (
            <span key={s} className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[10px] text-brand-light">
              {s}
            </span>
          ))}
        </div>
        <h3 className={compact ? "text-base" : "text-xl"}>{legend.title}</h3>
        {legend.role && <p className="text-xs text-text-dim">{legend.role}</p>}
        {!compact && legend.earnedBy && (
          <p className="text-sm leading-relaxed text-text-mid">
            <span className="text-text-dim">Earned it by </span>
            {legend.earnedBy[0].toLowerCase() + legend.earnedBy.slice(1)}.
          </p>
        )}
        {legend.quote && <p className={`mt-auto pt-2 font-semibold text-text-primary ${compact ? "text-sm" : "text-base"}`}>“{legend.quote}”</p>}
      </div>
    </article>
  );
}
