import { useState } from "react";
import { Check, Copy, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Campaign, ChecklistItem, PhotosDoc } from "../types";
import { progress } from "../utils/checklist";
import { section } from "../utils/parseDoc";
import { photoUrl, refUrl } from "../content";
import { copyImage } from "../utils/copyImage";
import { citiesIn, imageOf, OWNER, photoPrompt, promptOf, refLabel, refsFor } from "../utils/photoPrompt";
import { CheckItem, Checklist, ProgressBar } from "./Checklist";
import { Markdown } from "./Markdown";

function CopyPrompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };
  return (
    <button
      onClick={copy}
      title="Copy the full prompt: scene, character descriptions, photo style and the reference images to attach"
      className="flex shrink-0 items-center gap-1 rounded-md border border-border-subtle px-2 py-1 font-mono text-[11px] text-text-mid transition-colors hover:border-brand hover:text-brand-light"
    >
      {copied ? <Check size={11} weight="bold" /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy prompt"}
    </button>
  );
}

/**
 * A reference button's label. The photo's own legend's images go by what they
 * show ("Face"); anyone else by name, plus what it shows when they bring more
 * than one image ("Jason, face").
 */
function buttonLabel(r: { file: string; who: string | null }, all: { who: string | null }[], title?: string) {
  if (!r.who || r.who === title) return refLabel(r.file);
  const several = all.filter((x) => x.who === r.who).length > 1;
  return several ? `${r.who.split(" ")[0]}, ${refLabel(r.file).toLowerCase()}` : r.who;
}

/** One reference image; clicking copies the image itself, to paste into the image tool. */
function CopyRef({ url, label, title }: { url: string; label: string; title: string }) {
  const [state, setState] = useState<"idle" | "busy" | "copied">("idle");
  const copy = async () => {
    setState("busy");
    try {
      await copyImage(url);
      setState("copied");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
      toast.error("Couldn't copy the image. Try opening it and copying from there.");
    }
  };
  return (
    <button
      onClick={copy}
      title={`Copy image: ${title}`}
      className={`flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2 font-mono text-[10px] transition-colors ${
        state === "copied" ? "border-emerald-400/50 text-emerald-400" : "border-border-subtle text-text-mid hover:border-brand hover:text-brand-light"
      } ${state === "busy" ? "opacity-60" : ""}`}
    >
      <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-surface-2">
        <img src={url} alt="" className="h-full w-full object-cover object-top" />
        {state === "copied" && (
          <span className="absolute inset-0 flex items-center justify-center bg-emerald-500/80 text-white">
            <Check size={11} weight="bold" />
          </span>
        )}
      </span>
      {state === "copied" ? "Copied" : label}
    </button>
  );
}

/** One photo: the box to tick once it's shot, its prompt, and the images to attach. */
function PhotoCard({ doc, campaign, item, title }: { doc: PhotosDoc; campaign: Campaign; item: ChecklistItem; title?: string }) {
  const [open, setOpen] = useState(false);
  const prompt = promptOf(item);
  const refs = refsFor(item, campaign);
  const cities = citiesIn(item);
  const image = imageOf(item);
  return (
    <div className="flex flex-col rounded-xl border border-border-subtle bg-surface p-2">
      {image && (
        <a href={photoUrl(campaign.id, image)} target="_blank" rel="noreferrer" title={`Open ${image}`} className="mb-1 block overflow-hidden rounded-lg">
          <img
            src={photoUrl(campaign.id, image)}
            alt={item.label.replace(OWNER, "")}
            loading="lazy"
            className="aspect-[3/2] w-full bg-surface-2 object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
        </a>
      )}
      {(title || cities.length === 1) && (
        <div className="flex items-center gap-2 px-2 pt-1">
          {title && <p className="font-mono text-[11px] uppercase tracking-wider text-brand-light">{title}</p>}
          <span className="flex-1" />
          {cities.length === 1 && (
            <span className="rounded-full border border-border-subtle px-1.5 py-px font-mono text-[10px] text-text-dim">{cities[0]}</span>
          )}
        </div>
      )}
      <CheckItem doc={doc} item={item}>
        {item.label.replace(OWNER, "")}
      </CheckItem>
      {prompt && (
        <div className="mt-auto space-y-2 px-2 pb-1 pt-1">
          {cities.length > 1 && (
            <p className="flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
              <Warning size={12} weight="fill" className="mt-px shrink-0 text-amber-400" />
              Mixes {cities.join(" and ")}. Keep one city per photo.
            </p>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            title={open ? "Show less" : "Show the whole prompt"}
            className={`block w-full text-left text-xs leading-relaxed text-text-dim hover:text-text-mid ${open ? "" : "line-clamp-3"}`}
          >
            {prompt}
          </button>
          <div className="flex justify-end">
            <CopyPrompt text={photoPrompt(item, doc, campaign)} />
          </div>
          {refs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {refs.map((r) => (
                <CopyRef
                  key={r.file}
                  url={refUrl(campaign.id, r.file)}
                  label={buttonLabel(r, refs, title)}
                  title={`${r.file}, ${r.use}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The backstage shotlist: one row per setting, one card per legend, each card
 * a box to tick once it's shot and a prompt to generate it. Items without a
 * `**Name:**` are group shots.
 */
export function PhotoGrid({ doc, campaign }: { doc: PhotosDoc; campaign: Campaign }) {
  const shots = doc.checklist.filter((i) => i.section && i.section.toLowerCase() !== "checklist");
  const production = doc.checklist.filter((i) => i.section?.toLowerCase() === "checklist");
  const settings = [...new Set(shots.map((i) => i.section!))];
  const names = campaign.legends.map((l) => l.short);
  const style = section(doc, "Photo style");
  const { done, total } = progress(shots);

  return (
    <div className="space-y-6">
      {doc.intro && <Markdown>{doc.intro}</Markdown>}

      {style && (
        <details className="rounded-xl border border-border-subtle bg-surface p-4 md:p-5">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-text-dim">Photo style</summary>
          <div className="mt-3">
            <Markdown>{style.body}</Markdown>
          </div>
        </details>
      )}

      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-text-dim">
          {done}/{total} shot
        </span>
        <ProgressBar done={done} total={total} className="max-w-60 flex-1" />
      </div>

      {settings.map((setting) => {
        const items = shots.filter((i) => i.section === setting);
        const owned = items.filter((i) => OWNER.test(i.label));
        const loose = items.filter((i) => !OWNER.test(i.label));
        const owner = (i: ChecklistItem) => OWNER.exec(i.label)![1];
        // Legends in roster order, then anyone else the section names.
        const order = [...names, ...owned.map(owner).filter((n) => !names.includes(n))];
        return (
          <section key={setting}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-dim">{setting}</h3>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {order.flatMap((name) => {
                const item = owned.find((i) => owner(i) === name);
                return item ? [<PhotoCard key={item.line} doc={doc} campaign={campaign} item={item} title={name} />] : [];
              })}
              {loose.map((item) => (
                <PhotoCard key={item.line} doc={doc} campaign={campaign} item={item} />
              ))}
            </div>
          </section>
        );
      })}

      <Checklist doc={doc} items={production} />
    </div>
  );
}
