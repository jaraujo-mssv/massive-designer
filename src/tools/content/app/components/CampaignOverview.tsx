import { Warning } from "@phosphor-icons/react";
import { STATUS_IDS } from "../constants";
import type { Campaign, ContentDoc } from "../types";
import { progress } from "../utils/checklist";
import { section } from "../utils/parseDoc";
import { ProgressBar } from "./Checklist";
import { Markdown } from "./Markdown";
import { KindIcon, StatusPill } from "./pills";

function DocRow({ doc, onOpen }: { doc: ContentDoc; onOpen: (key: string) => void }) {
  const { done, total } = progress(doc.checklist);
  return (
    <button
      onClick={() => onOpen(doc.key)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-2"
    >
      <KindIcon kind={doc.kind} size={14} />
      <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{doc.title}</span>
      {total > 0 && (
        <span className="hidden w-32 items-center gap-2 sm:flex">
          <ProgressBar done={done} total={total} className="flex-1" />
          <span className="w-9 text-right font-mono text-[11px] text-text-dim">
            {done}/{total}
          </span>
        </span>
      )}
      <StatusPill status={doc.status} />
    </button>
  );
}

/** What a campaign is, what goes out when, and how far along each piece is. */
export function CampaignOverview({ campaign, onOpen }: { campaign: Campaign; onOpen: (key: string) => void }) {
  const { brief, docs } = campaign;
  const weeks = [...new Set(docs.map((d) => d.week).filter((w): w is number => w !== null))].sort((a, b) => a - b);
  const all = docs.flatMap((d) => d.checklist);
  const { done, total } = progress(all);
  const counts = STATUS_IDS.map((s) => [s, docs.filter((d) => d.status === s).length] as const).filter(([, n]) => n > 0);
  const questions = brief && section(brief, "Open questions");
  const warned = docs.filter((d) => d.warnings.length > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <header className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-text-dim">Campaign · {campaign.id}</p>
        <h1 className="text-2xl md:text-3xl">{campaign.title}</h1>
        {brief?.tagline && <p className="text-xl font-bold text-brand-light md:text-2xl">{brief.tagline}</p>}
        {brief?.goal && (
          <p className="max-w-2xl text-sm leading-relaxed text-text-mid">
            <span className="text-text-dim">Goal: </span>
            {brief.goal}
          </p>
        )}
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-dim">Checklist</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {done}
            <span className="text-base font-normal text-text-dim">/{total}</span>
          </p>
          <ProgressBar done={done} total={total} className="mt-2" />
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:col-span-2">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-dim">{docs.length} docs</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {counts.map(([s, n]) => (
              <span key={s} className="flex items-center gap-1.5">
                <StatusPill status={s} />
                <span className="font-mono text-xs text-text-mid">{n}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {weeks.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-dim">Rollout</h2>
          <ol className="relative space-y-3 border-l border-border-subtle pl-5">
            {weeks.map((w) => (
              <li key={w} className="relative">
                <span className="absolute -left-[25px] top-3 h-2.5 w-2.5 rounded-full border-2 border-brand bg-bg" />
                <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-brand-light">Week {w}</p>
                <div className="rounded-xl border border-border-subtle bg-surface p-1">
                  {docs
                    .filter((d) => d.week === w)
                    .map((d) => (
                      <DocRow key={d.key} doc={d} onOpen={onOpen} />
                    ))}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-dim">All docs</h2>
        <div className="rounded-xl border border-border-subtle bg-surface p-1">
          {docs.map((d) => (
            <DocRow key={d.key} doc={d} onOpen={onOpen} />
          ))}
        </div>
      </section>

      {questions?.body && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-dim">Open questions</h2>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <Markdown>{questions.body}</Markdown>
          </div>
        </section>
      )}

      {warned.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-dim">Needs fixing in the files</h2>
          {warned.map((d) => (
            <button
              key={d.key}
              onClick={() => onOpen(d.key)}
              className="flex w-full gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left text-xs text-amber-200"
            >
              <Warning size={14} weight="fill" className="mt-px shrink-0 text-amber-400" />
              <span>
                <span className="font-mono">{d.path}</span>: {d.warnings.join(" ")}
              </span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
