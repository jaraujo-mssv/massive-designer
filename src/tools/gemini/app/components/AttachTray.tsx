import { useRef, useState, type DragEvent } from "react";
import { ArrowCounterClockwise, ArrowLeft, Check, ClipboardText, Copy, Plus, UploadSimple, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { sidebarHeadingClass } from "@/shared/components/SidebarLayout";

/** A drag that starts on this page's own images, so the drop targets here ignore it. */
export const INTERNAL_DRAG = "application/x-massive-gemini";
export const markInternal = (e: DragEvent) => e.dataTransfer.setData(INTERNAL_DRAG, "1");

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const PASTE_KEY = isMac ? "⌘V" : "Ctrl+V";

/** A kit image or a reference photo, as the tray shows it. */
export interface TrayItem {
  key: string;
  label: string;
  /** What the thumbnail shows (a PNG of the kit logo, or the photo). */
  src: string | undefined;
  /** Background behind the thumbnail, for the logos. */
  ground?: string;
  copy: () => Promise<void>;
}

function Card({
  item,
  order,
  onToggle,
  name,
}: {
  item: TrayItem;
  /** Its place in the set, 1-based, or null when it isn't in it. */
  order: number | null;
  onToggle: () => void;
  /** For references: the editable name, and removal. */
  name?: { value: string; onChange: (name: string) => void; onRemove: () => void };
}) {
  const [state, setState] = useState<"idle" | "busy" | "copied">("idle");
  const [draftName, setDraftName] = useState<string | null>(null);
  const copy = async () => {
    setState("busy");
    try {
      await item.copy();
      setState("copied");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
      toast.error("Couldn't copy the image.");
    }
  };
  const commit = () => {
    if (name && draftName !== null && draftName.trim() && draftName.trim() !== name.value) name.onChange(draftName.trim());
    setDraftName(null);
  };

  return (
    <figure className="group min-w-0 space-y-1">
      <div className="relative">
        <button
          onClick={copy}
          title={`Copy “${item.label}” to paste it into Gemini`}
          className={`relative block aspect-square w-full overflow-hidden rounded-lg border transition-colors ${
            order !== null ? "border-brand" : "border-border-subtle hover:border-brand/60"
          } ${state === "busy" ? "opacity-60" : ""}`}
          style={{ background: item.ground ?? "var(--surface-2)" }}
        >
          {item.src && (
            <img
              src={item.src}
              alt={item.label}
              onDragStart={markInternal}
              className={`h-full w-full ${item.ground ? "object-contain p-1" : "object-cover"}`}
            />
          )}
          <span
            className={`pointer-events-none absolute inset-0 flex items-center justify-center gap-1 text-xs font-semibold text-white transition-opacity ${
              state === "copied" ? "bg-emerald-600/80 opacity-100" : "bg-black/55 opacity-0 group-hover:opacity-100"
            }`}
          >
            {state === "copied" ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
            {state === "copied" ? "Copied" : "Copy"}
          </span>
        </button>
        <button
          onClick={onToggle}
          aria-pressed={order !== null}
          aria-label={order !== null ? `Take “${item.label}” out of the set` : `Add “${item.label}” to the set`}
          title={order !== null ? "In the set: copied in this order. Click to take it out." : "Add to the set"}
          className={`absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border px-1 text-[11px] font-bold transition-colors ${
            order !== null
              ? "border-brand bg-brand text-white"
              : "border-white/30 bg-black/50 text-white/80 hover:border-white/70 hover:text-white"
          }`}
        >
          {order ?? <Plus size={12} weight="bold" />}
        </button>
        {name && (
          <button
            onClick={name.onRemove}
            aria-label={`Remove “${item.label}”`}
            title="Remove"
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white/80 opacity-0 transition-opacity hover:text-white focus:opacity-100 group-hover:opacity-100"
          >
            <X size={12} weight="bold" />
          </button>
        )}
      </div>
      {name ? (
        <input
          value={draftName ?? name.value}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setDraftName(null);
              e.currentTarget.blur();
            }
          }}
          aria-label="Reference name, used in the prompt"
          title="Its name in the prompt's list of images"
          className="w-full truncate rounded border border-transparent bg-transparent px-1 text-xs text-text-mid hover:border-border-subtle focus:border-brand focus:text-text-primary focus:outline-none"
        />
      ) : (
        <figcaption className="truncate px-1 text-xs text-text-mid">{item.label}</figcaption>
      )}
    </figure>
  );
}

const grid = "grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2";

export function AttachTray({
  kit,
  refs,
  setKeys,
  onToggle,
  onAddRefs,
  onRenameRef,
  onRemoveRef,
  onPasteRef,
  refsPersistent,
  dropActive,
  onDropActive,
}: {
  kit: TrayItem[];
  refs: TrayItem[];
  setKeys: string[];
  onToggle: (key: string) => void;
  onAddRefs: (files: File[]) => void;
  onRenameRef: (key: string, name: string) => void;
  onRemoveRef: (key: string) => void;
  onPasteRef: () => void;
  refsPersistent: boolean;
  /** A file is being dragged over the references. */
  dropActive: boolean;
  onDropActive: (active: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const orderOf = (key: string) => {
    const i = setKeys.indexOf(key);
    return i >= 0 ? i + 1 : null;
  };
  const fromOutside = (e: DragEvent) => !e.dataTransfer.types.includes(INTERNAL_DRAG) && e.dataTransfer.types.includes("Files");

  return (
    <section className="space-y-4 rounded-xl border border-border-subtle bg-surface p-4">
      <div className="space-y-1">
        <h2 className={sidebarHeadingClass}>Attach</h2>
        <p className="text-xs leading-relaxed text-text-dim">
          Click an image to copy it, then paste it into Gemini ({PASTE_KEY}). Add images to the set with + and Copy next
          (at the bottom) copies the prompt and then each one in that order.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-text-mid">Massive brand kit</h3>
        <div className={grid}>
          {kit.map((item) => (
            <Card key={item.key} item={item} order={orderOf(item.key)} onToggle={() => onToggle(item.key)} />
          ))}
        </div>
      </div>

      <div
        onDragOver={(e) => {
          if (!fromOutside(e)) return;
          e.preventDefault();
          e.stopPropagation();
          onDropActive(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onDropActive(false);
        }}
        onDrop={(e) => {
          if (!fromOutside(e)) return;
          e.preventDefault();
          e.stopPropagation();
          onDropActive(false);
          onAddRefs(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
        }}
        className={`space-y-2 rounded-lg transition-colors ${dropActive ? "bg-brand/10 outline-2 outline-offset-4 outline-dashed outline-brand" : ""}`}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-text-mid">Your references</h3>
          <div className="flex gap-1">
            <button
              onClick={onPasteRef}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-mid hover:bg-surface-2 hover:text-text-primary"
            >
              <ClipboardText size={14} />
              Paste
            </button>
            <button
              onClick={() => input.current?.click()}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-mid hover:bg-surface-2 hover:text-text-primary"
            >
              <UploadSimple size={14} />
              Add
            </button>
            <input
              ref={input}
              type="file"
              accept="image/*"
              multiple
              hidden
              aria-label="Reference photos"
              onChange={(e) => {
                onAddRefs(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>
        </div>
        {refs.length > 0 ? (
          <div className={grid}>
            {refs.map((item) => (
              <Card
                key={item.key}
                item={item}
                order={orderOf(item.key)}
                onToggle={() => onToggle(item.key)}
                name={{
                  value: item.label,
                  onChange: (name) => onRenameRef(item.key, name),
                  onRemove: () => onRemoveRef(item.key),
                }}
              />
            ))}
          </div>
        ) : (
          <button
            onClick={() => input.current?.click()}
            className="flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-border-subtle px-4 py-6 text-center text-xs text-text-dim transition-colors hover:border-brand/60 hover:text-text-mid"
          >
            <UploadSimple size={18} />
            Drop photos here, or click to add them: people, places, products, a style to match.
          </button>
        )}
        {!refsPersistent && (
          <p className="text-xs text-amber-300/80">This browser won't keep the references after you close the page.</p>
        )}
      </div>
    </section>
  );
}

export interface Step {
  key: string;
  label: string;
  copy: () => Promise<void>;
}

/**
 * The clipboard holds one thing at a time, so the set goes one step at a time:
 * copy the prompt, paste it into every window, copy the next image, and so on.
 * It starts over whenever the set changes.
 */
export function CopyNext({ steps }: { steps: Step[] }) {
  const signature = steps.map((s) => s.key).join("|");
  const [state, setState] = useState({ signature, index: 0, copied: null as string | null });
  const current = state.signature === signature ? state : { signature, index: 0, copied: null };
  const step = steps[current.index];
  const done = steps.length > 0 && current.index >= steps.length;

  const go = (index: number, copied: string | null = null) => setState({ signature, index, copied });

  const copy = async () => {
    if (done) return go(0);
    if (!step) return;
    try {
      await step.copy();
      go(current.index + 1, step.label);
    } catch {
      toast.error(`Couldn't copy “${step.label}”.`);
    }
  };

  return (
    <div className="sticky bottom-0 z-10 border-t border-border-subtle bg-surface px-3 py-2.5 md:px-6">
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <button
          onClick={() => go(Math.max(0, current.index - 1))}
          disabled={current.index === 0}
          aria-label="Back one step"
          title="Back one step"
          className="shrink-0 rounded-lg p-2 text-text-dim hover:bg-surface-2 hover:text-text-primary disabled:opacity-30"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          onClick={copy}
          disabled={steps.length === 0}
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-40"
        >
          {done ? <ArrowCounterClockwise size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
          <span className="truncate">
            {steps.length === 0
              ? "Copy next"
              : done
                ? "Start over"
                : `Copy ${current.index + 1} of ${steps.length} · ${step.label}`}
          </span>
        </button>
        <p className="min-w-0 flex-1 truncate text-xs text-text-dim">
          {steps.length === 0
            ? "Write a prompt or add images to the set, then copy them one after another."
            : current.copied
              ? `${current.copied} copied: paste it into each Gemini window (${PASTE_KEY}).`
              : done
                ? "All copied."
                : "Copies the prompt, then each image in the set."}
        </p>
        {current.index > 0 && !done && (
          <button
            onClick={() => go(0)}
            aria-label="Start over"
            title="Start over"
            className="shrink-0 rounded-lg p-2 text-text-dim hover:bg-surface-2 hover:text-text-primary"
          >
            <ArrowCounterClockwise size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
