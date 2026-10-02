import type { Campaign, LegendDoc, PhotosDoc, ScriptDoc } from "../types";
import { section } from "../utils/parseDoc";
import { refUrl } from "../content";
import { CheckItem } from "./Checklist";
import { LegendCard } from "./LegendCard";
import { Markdown } from "./Markdown";
import { KindIcon, StatusPill } from "./pills";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border-subtle py-3 last:border-b-0 md:grid-cols-[10rem_1fr] md:gap-4">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-text-dim">{label}</dt>
      <dd className="text-sm leading-relaxed text-text-mid">{children}</dd>
    </div>
  );
}

/** The legend's backstage photos, from the photos doc: rows written `**Washington:** …`. */
const backstageFor = (legend: LegendDoc, photos: PhotosDoc | undefined) =>
  photos?.checklist.filter((i) => i.label.startsWith(`**${legend.short}:**`)) ?? [];

export function LegendView({ doc, campaign, onOpen }: { doc: LegendDoc; campaign: Campaign; onOpen: (key: string) => void }) {
  const scripts = campaign.docs.filter((d): d is ScriptDoc => d.kind === "script" && d.legends.includes(doc.id));
  const photos = campaign.docs.find((d): d is PhotosDoc => d.kind === "photos");
  const backstage = backstageFor(doc, photos);
  const bit = section(doc, "The bit");
  const lines = section(doc, "Sample lines");

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
      <div className="w-full max-w-72 lg:sticky lg:top-0">
        <LegendCard legend={doc} />
      </div>

      <div className="min-w-0 space-y-6">
        <dl className="rounded-xl border border-border-subtle bg-surface px-4 md:px-5">
          {doc.look ? <Field label="Look">{doc.look}</Field> : <Field label="Look"><span className="text-amber-300">No description yet</span></Field>}
          {doc.role && <Field label="Modern role">{doc.role}</Field>}
          {doc.trait && <Field label="Trait brought back">{doc.trait}</Field>}
          {doc.nod && <Field label="Period nod">{doc.nod}</Field>}
          {doc.earnedBy && <Field label="Earned fame by">{doc.earnedBy}</Field>}
          {doc.trustBy && <Field label="Massive earns trust by">{doc.trustBy}</Field>}
          {doc.standards.length > 0 && (
            <Field label="Standards">
              {doc.standards.join(", ")}
              {doc.slides.length > 0 && <span className="text-text-dim"> · deck slides {doc.slides.join(", ")}</span>}
            </Field>
          )}
          {doc.endCard && <Field label="End card line">“{doc.endCard}”</Field>}
          <Field label="Real page">{doc.link ?? <span className="text-amber-300">Not decided yet</span>}</Field>
        </dl>

        {doc.refs.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-dim">Reference images</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {doc.refs.map((r) => (
                <a key={r.file} href={refUrl(doc.campaign, r.file)} target="_blank" rel="noreferrer" className="group block">
                  <img
                    src={refUrl(doc.campaign, r.file)}
                    alt={r.use}
                    className="aspect-square w-full rounded-lg border border-border-subtle bg-surface-2 object-cover object-top transition group-hover:border-brand"
                  />
                  <span className="mt-1 block font-mono text-[10px] text-text-dim">{r.file}</span>
                  <span className="block text-xs text-text-mid">{r.use}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {bit && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-dim">The bit</h3>
            <Markdown>{bit.body}</Markdown>
          </section>
        )}
        {lines && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-dim">Sample lines</h3>
            <Markdown>{lines.body}</Markdown>
          </section>
        )}

        {scripts.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-dim">Appears in</h3>
            <div className="flex flex-wrap gap-2">
              {scripts.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onOpen(s.key)}
                  className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary transition-colors hover:border-brand"
                >
                  <KindIcon kind="script" size={13} />
                  {s.title}
                  <StatusPill status={s.status} />
                </button>
              ))}
            </div>
          </section>
        )}

        {photos && backstage.length > 0 && (
          <section className="rounded-xl border border-border-subtle bg-surface p-4 md:p-5">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-text-dim">Backstage photos</h3>
              <span className="flex-1" />
              <button onClick={() => onOpen(photos.key)} className="font-mono text-[11px] text-brand-light hover:underline">
                All photos
              </button>
            </div>
            <div className="-mx-2">
              {backstage.map((item) => (
                <CheckItem key={item.line} doc={photos} item={item}>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-text-dim">{item.section}</span>
                  <br />
                  {item.label.replace(/^\*\*[^*]+:\*\*\s*/, "")}
                </CheckItem>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
