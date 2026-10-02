import { FORMATS } from "../constants";
import type { Campaign, Entry, ScriptDoc, Shot } from "../types";
import { fmtSeconds, totalSeconds } from "../utils/shots";
import { Checklist } from "./Checklist";
import { Markdown } from "./Markdown";

/** Length against the target; when it runs over, it says so. */
function Timing({ doc }: { doc: ScriptDoc }) {
  const total = totalSeconds(doc.shots);
  const over = doc.target !== null && total > doc.target;
  const planned = doc.shots.every((s) => s.duration !== null);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-text-dim">
      <span>
        {doc.shots.length} shots · {FORMATS[doc.format].label}
      </span>
      <span className={over ? "text-amber-300" : ""}>
        {planned ? "" : "~"}
        {fmtSeconds(total)}
        {doc.target !== null && ` of ${fmtSeconds(doc.target)}`}
        {over && " · over"}
      </span>
      <span className="text-text-dim/70">
        {planned ? "planned shot lengths" : "estimate where a shot has no length: words at 2.6/s, 2s minimum"}
      </span>
    </div>
  );
}

function Entries({ title, entries }: { title: string; entries: Entry[] }) {
  if (!entries.length) return null;
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 md:p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-dim">{title}</h3>
      <dl className="space-y-3">
        {entries.map((e) => (
          <div key={e.name}>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-brand-light">{e.name}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-text-mid">{e.look || <span className="text-amber-300">No description yet</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed">
      <span className="mr-1.5 font-mono text-[10px] uppercase tracking-wider text-text-dim">{label}</span>
      <span className="text-text-mid">{children}</span>
    </p>
  );
}

function ShotCard({ shot }: { shot: Shot }) {
  return (
    <article className="border-b border-border-subtle last:border-b-0">
      <header className="flex items-center gap-2 bg-surface px-4 py-2">
        <span className="font-mono text-xs font-semibold text-text-primary">Shot {String(shot.n).padStart(2, "0")}</span>
        {shot.endCard && <span className="rounded bg-brand/15 px-1.5 py-0.5 font-mono text-[10px] text-brand-light">END CARD</span>}
        <span className="flex-1" />
        <span className="font-mono text-xs text-text-dim">
          {shot.duration === null ? "~" : ""}
          {fmtSeconds(shot.seconds)}
        </span>
      </header>
      <div className="grid gap-4 px-4 py-3 md:grid-cols-[3fr_2fr]">
        <div className="space-y-1.5">
          <p className="text-sm leading-relaxed text-text-primary">{shot.visual}</p>
          {shot.camera && <Field label="Camera">{shot.camera}</Field>}
          {shot.action && <Field label="Action">{shot.action}</Field>}
          {shot.screen && <Field label="Screen">{shot.screen}</Field>}
          {shot.sound && <Field label="Sound">{shot.sound}</Field>}
        </div>
        <div className="space-y-1.5">
          {shot.lines.map((l, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {l.speaker && (
                <span className={`mr-1.5 font-mono text-[11px] uppercase tracking-wider ${l.speaker === "VO" ? "text-text-dim" : "text-brand-light"}`}>
                  {l.speaker}
                  {l.manner && <span className="normal-case tracking-normal text-text-dim"> ({l.manner})</span>}
                </span>
              )}
              <span className={l.speaker === "VO" ? "italic text-text-mid" : "text-text-primary"}>“{l.text}”</span>
            </p>
          ))}
          {shot.directions.map((d, i) => (
            <p key={`d${i}`} className="text-xs italic text-text-dim">
              {d}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}

export function ScriptView({ doc, campaign }: { doc: ScriptDoc; campaign: Campaign }) {
  const { brief } = campaign;
  // The legends first, from their own docs, then the script's supporting cast.
  const cast: Entry[] = [
    ...campaign.legends.filter((l) => doc.legends.includes(l.id)).map((l) => ({ name: l.short, look: l.look ?? "" })),
    ...doc.cast,
  ];

  return (
    <div className="space-y-6">
      {doc.intro && <Markdown>{doc.intro}</Markdown>}
      <Timing doc={doc} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Entries title="Cast" entries={cast} />
        <Entries title="Sets" entries={doc.sets} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border-subtle">
        {doc.shots.map((shot) => (
          <ShotCard key={shot.n} shot={shot} />
        ))}
      </div>

      {(doc.endCard || brief?.tagline) && (
        <section className="rounded-xl border border-border-subtle bg-surface p-4 md:p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-dim">End card</h3>
          <div className="space-y-1">
            {doc.endCard && <p className="text-sm text-text-mid">{doc.endCard}</p>}
            {brief?.tagline && <p className="text-lg font-bold text-text-primary">{brief.tagline}</p>}
            {brief?.signoff && <p className="text-sm text-text-mid">{brief.signoff}</p>}
            {brief?.url && <p className="font-mono text-xs text-brand-light">{brief.url}</p>}
          </div>
        </section>
      )}

      <Checklist doc={doc} items={doc.checklist} />
    </div>
  );
}
