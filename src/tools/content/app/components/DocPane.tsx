import { useState } from "react";
import { Check, Copy, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { FORMATS, KIND, type ScriptView as ScriptViewId } from "../constants";
import type { Campaign, ContentDoc, ScriptDoc } from "../types";
import { flowBrief } from "../utils/flowBrief";
import { section } from "../utils/parseDoc";
import { AnimaticBoard } from "./AnimaticBoard";
import { Checklist } from "./Checklist";
import { LegendView } from "./LegendView";
import { Markdown } from "./Markdown";
import { PagePreview } from "./PagePreview";
import { PhotoGrid } from "./PhotoGrid";
import { Chip, KindIcon, StatusControl } from "./pills";
import { ScriptView } from "./ScriptView";

/** Facts from the frontmatter, as chips under the title. */
function chips(doc: ContentDoc, campaign: Campaign): string[] {
  const name = (id: string) => campaign.legends.find((l) => l.id === id)?.short ?? id;
  const week = doc.week !== null ? [`Week ${doc.week}`] : [];
  switch (doc.kind) {
    case "script":
      return [
        ...week,
        FORMATS[doc.format].label,
        ...(doc.target ? [`${doc.target}s target`] : []),
        ...doc.legends.map(name),
        ...doc.standards,
      ];
    case "legend":
      return [...week, ...doc.standards];
    default:
      return week;
  }
}

/** Copies the script as one brief for a video generation agent (see utils/flowBrief.ts). */
function CopyForFlow({ doc, campaign }: { doc: ScriptDoc; campaign: Campaign }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(flowBrief(doc, campaign));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };
  return (
    <button
      onClick={copy}
      title="Copy the whole script, with cast, sets and every shot, as one brief for ElevenLabs Flow"
      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
    >
      {copied ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
      {copied ? "Copied" : "Copy for Flow"}
    </button>
  );
}

/** The brief: its sections as written, then its checklist. */
function BriefView({ doc }: { doc: ContentDoc }) {
  const body = doc.sections
    .filter((s) => s.heading.toLowerCase() !== "checklist")
    .map((s) => `## ${s.heading}\n\n${s.body}`)
    .join("\n\n");
  // A line above the items ("Shared across all four reels:") titles the checklist.
  const lead = section(doc, "Checklist")?.body.split("\n")[0].replace(/:$/, "");
  return (
    <div className="max-w-4xl space-y-6">
      {doc.intro && <Markdown>{doc.intro}</Markdown>}
      <Markdown>{body}</Markdown>
      <Checklist doc={doc} items={doc.checklist} title={lead && !lead.startsWith("- ") ? lead : "Checklist"} />
    </div>
  );
}

export function DocPane({
  doc,
  campaign,
  view,
  viewSwitch,
  onOpen,
}: {
  doc: ContentDoc;
  campaign: Campaign;
  view: ScriptViewId;
  /** Script / Animatic, shown in the header on desktop (phones have it in the bar). */
  viewSwitch: React.ReactNode;
  onOpen: (key: string) => void;
}) {
  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 space-y-3">
        <p className="flex items-center gap-1.5 font-mono text-[11px] text-text-dim">
          <KindIcon kind={doc.kind} size={12} />
          {KIND[doc.kind].label} · {doc.path}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 flex-1 text-xl md:text-2xl">{doc.title}</h1>
          {viewSwitch}
          {doc.kind === "script" && <CopyForFlow doc={doc} campaign={campaign} />}
          <StatusControl doc={doc} />
        </div>
        {chips(doc, campaign).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips(doc, campaign).map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </div>
        )}
      </header>

      {doc.warnings.length > 0 && (
        <div className="mb-6 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
          <Warning size={16} weight="fill" className="mt-px shrink-0 text-amber-400" />
          <ul className="space-y-1">
            {doc.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {doc.kind === "script" && view === "script" && <ScriptView doc={doc} campaign={campaign} />}
      {doc.kind === "script" && view === "animatic" && <AnimaticBoard doc={doc} brief={campaign.brief} />}
      {doc.kind === "legend" && <LegendView doc={doc} campaign={campaign} onOpen={onOpen} />}
      {doc.kind === "photos" && <PhotoGrid doc={doc} campaign={campaign} />}
      {doc.kind === "page" && <PagePreview doc={doc} campaign={campaign} />}
      {doc.kind === "brief" && <BriefView doc={doc} />}
    </div>
  );
}
