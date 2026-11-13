import { useState } from "react";
import { Check, ClipboardText, Copy, DownloadSimple, FolderOpen, FolderPlus, PencilSimple, Trash, UserFocus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { sidebarHeadingClass } from "@/shared/components/SidebarLayout";
import { saveFile } from "@/shared/utils/saveFile";
import { ImageButton } from "@/tools/content/app/components/Lightbox";
import { copyImage, copyText } from "../clipboard";
import type { Folder, Run, SavedRecord, WithUrl } from "../hooks";
import { titleOf } from "../prompt";
import { PASTE_KEY, markInternal } from "./AttachTray";

type Saved = WithUrl<SavedRecord>;

const when = (t: number) => new Date(t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

const iconButton =
  "rounded-md p-1.5 text-text-dim transition-colors hover:bg-surface-2 hover:text-text-primary disabled:opacity-40";

function FolderBar({ folder, onPick, onReconnect }: { folder: Folder; onPick: () => void; onReconnect: () => void }) {
  if (folder.status === "loading") return null;
  if (folder.status === "unsupported")
    return (
      <p className="text-xs leading-relaxed text-text-dim">
        This browser can't write to a folder, so each saved image is also downloaded. Chrome or Edge can save them
        straight into a folder.
      </p>
    );
  if (folder.status === "none")
    return (
      <button
        onClick={onPick}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border-subtle px-3 py-2 text-left text-xs text-text-mid transition-colors hover:border-brand hover:text-brand-light"
      >
        <FolderPlus size={16} />
        Pick a folder, and every saved image is written there too
      </button>
    );
  if (folder.status === "prompt")
    return (
      <button
        onClick={onReconnect}
        className="flex w-full items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left text-xs text-amber-200 transition-colors hover:border-amber-400/60"
      >
        <FolderOpen size={16} />
        <span>
          Allow saving to <strong className="font-semibold">{folder.handle.name}</strong> again (the browser asks once a visit)
        </span>
      </button>
    );
  return (
    <div className="flex items-center gap-2 text-xs text-text-mid">
      <FolderOpen size={16} className="shrink-0 text-brand-light" />
      <span className="min-w-0 flex-1 truncate">
        Saving to <strong className="font-semibold text-text-primary">{folder.handle.name}</strong>, one folder a day
      </span>
      <button onClick={onPick} className="shrink-0 rounded-md px-2 py-1 hover:bg-surface-2 hover:text-text-primary">
        Change
      </button>
    </div>
  );
}

function SavedCard({ item, onUseAsRef, onRemove }: { item: Saved; onUseAsRef: () => void; onRemove: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await copyImage(item.url, { maxSide: 4096 });
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy the image.");
    }
  };
  return (
    <figure className="mb-3 break-inside-avoid space-y-1">
      <ImageButton src={item.url} alt={titleOf(item.run.draft || item.run.prompt)} caption={item.path ?? item.fileName}>
        <img
          src={item.url}
          alt=""
          onDragStart={markInternal}
          className="block w-full rounded-lg bg-surface-2"
          style={item.width && item.height ? { aspectRatio: `${item.width} / ${item.height}` } : undefined}
        />
      </ImageButton>
      <figcaption className="flex items-center gap-0.5">
        <span className="min-w-0 flex-1 truncate text-[11px] text-text-dim" title={item.path ?? item.fileName}>
          {item.width && item.height ? `${item.width}×${item.height}` : item.fileName}
        </span>
        <button onClick={copy} className={iconButton} title="Copy, to paste back into Gemini and edit it" aria-label="Copy image">
          {copied ? <Check size={14} weight="bold" className="text-emerald-400" /> : <Copy size={14} />}
        </button>
        <button onClick={onUseAsRef} className={iconButton} title="Use as a reference" aria-label="Use as a reference">
          <UserFocus size={14} />
        </button>
        <button onClick={() => saveFile(item.blob, item.fileName)} className={iconButton} title="Download" aria-label="Download">
          <DownloadSimple size={14} />
        </button>
        <button
          onClick={onRemove}
          className={iconButton}
          title={item.path ? "Remove from the gallery (the file stays in the folder)" : "Remove from the gallery"}
          aria-label="Remove from the gallery"
        >
          <Trash size={14} />
        </button>
      </figcaption>
    </figure>
  );
}

/** The saved images, one group per run (the prompt they came from), newest first. */
function groups(saved: Saved[]): { run: Run; items: Saved[] }[] {
  const byRun = new Map<string, { run: Run; items: Saved[] }>();
  for (const item of [...saved].sort((a, b) => b.savedAt - a.savedAt)) {
    const group = byRun.get(item.run.id) ?? { run: item.run, items: [] };
    group.items.push(item);
    byRun.set(item.run.id, group);
  }
  // Within a run, in the order they were saved.
  return [...byRun.values()].map((g) => ({ ...g, items: g.items.reverse() }));
}

export function SavedGallery({
  saved,
  persistent,
  folder,
  onPick,
  onReconnect,
  onPaste,
  onCopyRunPrompt,
  onLoadRun,
  onUseAsRef,
  onRemove,
}: {
  saved: Saved[];
  persistent: boolean;
  folder: Folder;
  onPick: () => void;
  onReconnect: () => void;
  onPaste: () => void;
  /** Copies a run's prompt again; images saved next join that run. */
  onCopyRunPrompt: (run: Run) => void;
  onLoadRun: (run: Run) => void;
  onUseAsRef: (item: Saved) => void;
  onRemove: (item: Saved) => void;
}) {
  const runs = groups(saved);
  return (
    <section className="space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className={sidebarHeadingClass}>Saved</h2>
        <button
          onClick={onPaste}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-mid hover:bg-surface-2 hover:text-text-primary"
        >
          <ClipboardText size={14} />
          Paste
        </button>
      </div>

      <FolderBar folder={folder} onPick={onPick} onReconnect={onReconnect} />

      <p className="rounded-lg border border-dashed border-border-subtle px-3 py-3 text-xs leading-relaxed text-text-dim">
        Copy an image in Gemini and press {PASTE_KEY} here, or drop it anywhere on this page, to save it. For the full
        size, use Gemini's download button and drop the file here.
      </p>

      {!persistent && (
        <p className="text-xs text-amber-300/80">This browser won't keep the gallery after you close the page.</p>
      )}

      {runs.map(({ run, items }) => (
        <div key={run.id} className="space-y-2 border-t border-border-subtle pt-3">
          <div className="flex items-start gap-2">
            <details className="min-w-0 flex-1">
              <summary className="cursor-pointer list-none text-sm text-text-primary">
                <span className="line-clamp-2">{run.draft.trim() || run.prompt || "No prompt"}</span>
                <span className="block text-xs text-text-dim">
                  {when(run.startedAt)} · {items.length} {items.length === 1 ? "image" : "images"}
                </span>
              </summary>
              {run.prompt && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-bg/40 p-2 text-xs leading-relaxed text-text-mid">{run.prompt}</p>
              )}
            </details>
            {run.prompt && (
              <>
                <button
                  onClick={() => {
                    copyText(run.prompt)
                      .then(() => {
                        onCopyRunPrompt(run);
                        toast.success("Prompt copied. Images you save now join this group.");
                      })
                      .catch(() => toast.error("Couldn't copy to the clipboard"));
                  }}
                  className={iconButton}
                  title="Copy this prompt again"
                  aria-label="Copy this prompt again"
                >
                  <Copy size={14} />
                </button>
                <button onClick={() => onLoadRun(run)} className={iconButton} title="Load into the editor" aria-label="Load into the editor">
                  <PencilSimple size={14} />
                </button>
              </>
            )}
          </div>
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-2 xl:columns-3">
            {items.map((item) => (
              <SavedCard key={item.id} item={item} onUseAsRef={() => onUseAsRef(item)} onRemove={() => onRemove(item)} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
