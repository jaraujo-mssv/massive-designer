import { User } from "@phosphor-icons/react";
import { refUrl } from "../content";
import type { Campaign, PersonDoc, PhotosDoc } from "../types";
import { promptOf } from "../utils/photoPrompt";
import { Markdown } from "./Markdown";

/** A real person in the campaign: who they are, how they're described to image models, and where they appear. */
export function PersonView({ doc, campaign, onOpen }: { doc: PersonDoc; campaign: Campaign; onOpen: (key: string) => void }) {
  const photos = campaign.docs.find((d): d is PhotosDoc => d.kind === "photos");
  const appears = photos?.checklist.filter((i) => promptOf(i)?.includes(doc.short)) ?? [];
  const portrait = doc.refs[0]?.file;

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
      <div className="w-full max-w-64 overflow-hidden rounded-2xl border border-border-subtle bg-surface">
        {portrait ? (
          <img src={refUrl(doc.campaign, portrait)} alt={doc.title} className="aspect-[4/5] w-full object-cover object-top" />
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center bg-surface-2 text-text-dim/40">
            <User size={40} weight="thin" />
          </div>
        )}
        <div className="p-4">
          <h3 className="text-lg">{doc.title}</h3>
          {doc.role && <p className="text-xs text-text-dim">{doc.role}</p>}
        </div>
      </div>

      <div className="min-w-0 space-y-6">
        {doc.intro && <Markdown>{doc.intro}</Markdown>}

        <section className="rounded-xl border border-border-subtle bg-surface p-4 md:p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-dim">Look</h3>
          <p className="text-sm leading-relaxed text-text-mid">{doc.look ?? <span className="text-amber-300">No description yet</span>}</p>
        </section>

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

        {photos && appears.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-text-dim">In {appears.length} photos</h3>
              <span className="flex-1" />
              <button onClick={() => onOpen(photos.key)} className="font-mono text-[11px] text-brand-light hover:underline">
                All photos
              </button>
            </div>
            <ul className="space-y-1 rounded-xl border border-border-subtle bg-surface p-3">
              {appears.map((i) => (
                <li key={i.line} className="text-sm text-text-mid">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-text-dim">{i.section}</span> ·{" "}
                  {i.label.replace(/^\*\*([^*]+):\*\*\s*/, "$1: ")}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
