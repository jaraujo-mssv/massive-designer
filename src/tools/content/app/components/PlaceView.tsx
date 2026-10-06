import { MapPin } from "@phosphor-icons/react";
import { refUrl } from "../content";
import type { Campaign, PlaceDoc } from "../types";
import { photoDocsOf, placeAspect, placeIn, placePrompt } from "../utils/photoPrompt";
import { Markdown } from "./Markdown";
import { CopyPrompt } from "./PhotoGrid";

/** A recurring place: its reference image, how photos set there describe it, and which photos those are. */
export function PlaceView({ doc, campaign, onOpen }: { doc: PlaceDoc; campaign: Campaign; onOpen: (key: string) => void }) {
  const photoDocs = photoDocsOf(campaign);
  const photos = photoDocs[0];
  const appears = photoDocs.flatMap((p) =>
    p.checklist.filter((i) => placeIn(i, campaign)?.key === doc.key).map((item) => ({ key: `${p.key}:${item.line}`, item })),
  );
  const image = doc.refs[0]?.file;
  const aspect = placeAspect(doc).replace(":", "/");

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
        {image ? (
          <a href={refUrl(doc.campaign, image)} target="_blank" rel="noreferrer" title={`Open ${image}`}>
            <img
              src={refUrl(doc.campaign, image)}
              alt={doc.title}
              style={{ aspectRatio: aspect }}
              className="max-h-[32rem] w-full bg-surface-2 object-contain"
            />
          </a>
        ) : (
          <div style={{ aspectRatio: aspect }} className="flex max-h-[32rem] w-full flex-col items-center justify-center gap-2 bg-surface-2 text-text-dim/60">
            <MapPin size={40} weight="thin" />
            <span className="font-mono text-[11px]">npm run content:photos -- {doc.campaign} --places</span>
          </div>
        )}
        <div className="flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg">{doc.title}</h3>
            {doc.shot && <p className="text-xs text-text-dim">Reference image seen {doc.shot}</p>}
          </div>
          <CopyPrompt text={placePrompt(doc)} title="Copy the prompt for this place's reference image" />
        </div>
      </div>

      {doc.intro && <Markdown>{doc.intro}</Markdown>}

      <section className="rounded-xl border border-border-subtle bg-surface p-4 md:p-5">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-dim">Look</h3>
        <p className="text-sm leading-relaxed text-text-mid">{doc.look ?? <span className="text-amber-300">No description yet</span>}</p>
        {doc.match.length > 0 && (
          <p className="mt-3 text-xs text-text-dim">
            Photos whose prompt says{" "}
            {doc.match.map((m, i) => (
              <span key={m}>
                {i > 0 && (i === doc.match.length - 1 ? " or " : ", ")}
                <span className="font-mono text-text-mid">“{m}”</span>
              </span>
            ))}{" "}
            are set here.
          </p>
        )}
      </section>

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
            {appears.map(({ key, item: i }) => (
              <li key={key} className="text-sm text-text-mid">
                <span className="font-mono text-[11px] uppercase tracking-wider text-text-dim">{i.section}</span> ·{" "}
                {i.label.replace(/^\*\*([^*]+):\*\*\s*/, "$1: ")}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
