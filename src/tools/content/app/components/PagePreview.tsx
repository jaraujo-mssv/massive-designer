import { useState } from "react";
import { Desktop, DeviceMobile, Image, Play } from "@phosphor-icons/react";
import type { Campaign, DocSection, PageDoc } from "../types";
import { Checklist } from "./Checklist";
import { ConsentToy } from "./ConsentToy";
import { LegendCard } from "./LegendCard";
import { Markdown } from "./Markdown";

type Width = "desktop" | "phone";
const WIDTHS: Record<Width, { px: number; label: string; Icon: typeof Desktop }> = {
  desktop: { px: 1200, label: "Desktop", Icon: Desktop },
  phone: { px: 390, label: "Phone", Icon: DeviceMobile },
};

/** `<!-- block: legends -->` → "legends": a section that draws something live. */
const blockOf = (section: DocSection) => /<!--\s*block:\s*([\w-]+)\s*-->/.exec(section.body)?.[1] ?? null;

function Placeholder({ label, ratio, icon: Icon }: { label: string; ratio: string; icon: typeof Image }) {
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-hov bg-surface-2/50 text-text-dim"
      style={{ aspectRatio: ratio }}
    >
      <Icon size={28} weight="thin" />
      <span className="font-mono text-[11px] uppercase tracking-widest">{label}</span>
    </div>
  );
}

function Block({ section, campaign }: { section: DocSection; campaign: Campaign }) {
  const body = <Markdown>{section.body}</Markdown>;
  switch (blockOf(section)) {
    case "hero":
      return (
        <div className="space-y-6 py-6 text-center [&_h1]:text-4xl @3xl:[&_h1]:text-6xl">
          {body}
          <Placeholder label="Group shot of the four" ratio="16 / 7" icon={Image} />
        </div>
      );
    case "film":
      return (
        <div className="space-y-4">
          {body}
          <Placeholder label="Full video" ratio="16 / 9" icon={Play} />
        </div>
      );
    case "legends":
      return (
        <div className="space-y-4">
          {body}
          <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
            {campaign.legends.map((l) => (
              <LegendCard key={l.key} legend={l} compact />
            ))}
          </div>
        </div>
      );
    case "quotes":
      return (
        <div className="space-y-4">
          {body}
          <div className="grid gap-3 @3xl:grid-cols-2">
            {campaign.legends
              .filter((l) => l.quote)
              .map((l) => (
                <figure key={l.key} className="rounded-xl border border-border-subtle bg-surface p-5">
                  <blockquote className="text-xl font-bold leading-snug text-text-primary">“{l.quote}”</blockquote>
                  <figcaption className="mt-2 font-mono text-[11px] uppercase tracking-widest text-brand-light">{l.title}</figcaption>
                </figure>
              ))}
          </div>
        </div>
      );
    case "toy":
      return (
        <div className="space-y-4">
          {body}
          <ConsentToy />
        </div>
      );
    case "cost":
      return <div className="rounded-2xl border border-brand/30 bg-brand/5 p-6">{body}</div>;
    default:
      return body;
  }
}

/** The landing page as a wireframe, section by section, at desktop or phone width. */
export function PagePreview({ doc, campaign }: { doc: PageDoc; campaign: Campaign }) {
  const [width, setWidth] = useState<Width>("desktop");
  const sections = doc.sections.filter((s) => s.heading.toLowerCase() !== "checklist");

  return (
    <div className="space-y-6">
      {doc.intro && <Markdown>{doc.intro}</Markdown>}

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-border-subtle bg-surface p-0.5">
          {(Object.keys(WIDTHS) as Width[]).map((w) => {
            const { label, Icon } = WIDTHS[w];
            return (
              <button
                key={w}
                onClick={() => setWidth(w)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs transition-colors ${
                  width === w ? "bg-surface-2 text-brand-light" : "text-text-dim hover:text-text-primary"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
        <span className="font-mono text-[11px] text-text-dim">{sections.length} sections</span>
      </div>

      {/* A container, so the blocks lay out for the chosen width rather than the window's. */}
      <div className="@container mx-auto w-full overflow-hidden rounded-xl border border-border-subtle bg-bg" style={{ maxWidth: WIDTHS[width].px }}>
        <div className="flex items-center gap-2 border-b border-border-subtle bg-surface px-3 py-2">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2 w-2 rounded-full bg-border-hov" />
            ))}
          </span>
          <span className="flex-1 truncate rounded-md bg-surface-2 px-3 py-1 text-center font-mono text-[11px] text-text-dim">
            {doc.url ?? doc.title}
          </span>
        </div>
        {sections.map((s, i) => (
          <section key={s.heading} className="border-b border-border-subtle px-5 py-8 last:border-b-0 @3xl:px-12 @3xl:py-12">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-text-dim">
              {String(i + 1).padStart(2, "0")} · {s.heading}
            </p>
            <Block section={s} campaign={campaign} />
          </section>
        ))}
      </div>

      <Checklist doc={doc} items={doc.checklist.filter((i) => i.section?.toLowerCase() === "checklist")} />
    </div>
  );
}
