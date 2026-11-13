import { useState } from "react";
import { BookmarkSimple, Check, Copy, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Segmented } from "@/shared/canvas/DesignPanel";
import { sidebarButtonClass, sidebarHeadingClass, sidebarInputClass } from "@/shared/components/SidebarLayout";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { useStored } from "../hooks";
import { DEFAULT_OPTIONS, FORMATS, titleOf, type PromptOptions, type Style } from "../prompt";

export interface SavedPrompt {
  id: string;
  title: string;
  draft: string;
  options: PromptOptions;
  updatedAt: number;
}

const STYLES: { id: Style; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "dark", label: "Massive dark" },
  { id: "light", label: "Massive light" },
];

const readLibrary = (raw: unknown): SavedPrompt[] =>
  Array.isArray(raw)
    ? raw
        .filter((p) => p && typeof p.id === "string" && typeof p.draft === "string")
        .map((p) => ({ ...p, title: String(p.title ?? titleOf(p.draft)), options: { ...DEFAULT_OPTIONS, ...p.options } }))
    : [];

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id} className="text-xs font-normal text-text-mid">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function PromptPanel({
  draft,
  onDraftChange,
  options,
  onOptionsChange,
  composed,
  onCopy,
}: {
  draft: string;
  onDraftChange: (draft: string) => void;
  options: PromptOptions;
  onOptionsChange: (options: PromptOptions) => void;
  /** The prompt as it will be copied. */
  composed: string;
  /** Copies it (and starts a run); false when it couldn't. */
  onCopy: () => Promise<boolean>;
}) {
  const [library, setLibrary] = useStored<SavedPrompt[]>("gemini:prompts", [], readLibrary);
  // The library prompt open in the editor, so Save can update it.
  const [loadedId, setLoadedId] = useStored<string | null>("gemini:loaded", null);
  const [naming, setNaming] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const loaded = library.find((p) => p.id === loadedId) ?? null;
  const changed = loaded !== null && (loaded.draft !== draft || JSON.stringify(loaded.options) !== JSON.stringify(options));

  const set = (patch: Partial<PromptOptions>) => onOptionsChange({ ...options, ...patch });

  const copy = async () => {
    if (await onCopy()) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const saveNew = (title: string) => {
    const prompt: SavedPrompt = {
      id: crypto.randomUUID(),
      title: title.trim() || titleOf(draft),
      draft,
      options,
      updatedAt: Date.now(),
    };
    setLibrary((all) => [prompt, ...all]);
    setLoadedId(prompt.id);
    setNaming(null);
    toast.success(`Saved “${prompt.title}”`);
  };

  const update = () => {
    if (!loaded) return;
    setLibrary((all) => all.map((p) => (p.id === loaded.id ? { ...p, draft, options, updatedAt: Date.now() } : p)));
    toast.success(`Updated “${loaded.title}”`);
  };

  const load = (p: SavedPrompt) => {
    onDraftChange(p.draft);
    onOptionsChange(p.options);
    setLoadedId(p.id);
  };

  const remove = (p: SavedPrompt) => {
    const at = library.indexOf(p);
    setLibrary((all) => all.filter((x) => x.id !== p.id));
    if (loadedId === p.id) setLoadedId(null);
    toast(`Deleted “${p.title}”`, {
      action: { label: "Undo", onClick: () => setLibrary((all) => [...all.slice(0, at), p, ...all.slice(at)]) },
    });
  };

  return (
    <section className="space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={sidebarHeadingClass}>Prompt</h2>
        {loaded && (
          <span className="truncate text-xs text-text-dim" title={loaded.title}>
            {loaded.title}
            {changed && " · edited"}
          </span>
        )}
      </div>

      <textarea
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        rows={6}
        placeholder="Describe the image: the scene, the subject, the light, the words on it…"
        className={`${sidebarInputClass} resize-y leading-relaxed`}
      />

      <div className="space-y-2">
        <Segmented options={STYLES} value={options.style} onChange={(style) => set({ style })} />
        <Segmented options={FORMATS} value={options.format} onChange={(format) => set({ format })} />
        <Toggle id="gemini-no-brands" label="No other brands or logos" checked={options.noBrands} onChange={(noBrands) => set({ noBrands })} />
        <Toggle
          id="gemini-list-refs"
          label="List the attached images in the prompt"
          checked={options.listRefs}
          onChange={(listRefs) => set({ listRefs })}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={copy}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
        >
          {copied ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
          {copied ? "Copied" : "Copy prompt"}
        </button>
        {loaded && changed ? (
          <button onClick={update} className={`${sidebarButtonClass} !w-auto`} title={`Save the changes to “${loaded.title}”`}>
            <BookmarkSimple size={16} weight="fill" />
            Update
          </button>
        ) : null}
        <button
          onClick={() => setNaming(titleOf(draft))}
          disabled={!draft.trim()}
          className={`${sidebarButtonClass} !w-auto disabled:opacity-40`}
          title="Keep this prompt in the library"
        >
          <BookmarkSimple size={16} />
          {loaded && changed ? "Save as new" : "Save"}
        </button>
      </div>

      {naming !== null && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveNew(naming);
          }}
          className="flex gap-2"
        >
          <input
            autoFocus
            value={naming}
            onChange={(e) => setNaming(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setNaming(null)}
            aria-label="Prompt title"
            className={sidebarInputClass}
          />
          <button type="submit" className={`${sidebarButtonClass} !w-auto`}>
            Save
          </button>
        </form>
      )}

      {composed && (
        <details className="group rounded-lg border border-border-subtle bg-bg/40">
          <summary className="cursor-pointer select-none px-3 py-2 text-xs text-text-dim hover:text-text-primary">
            The prompt as it's copied
          </summary>
          <p className="whitespace-pre-wrap border-t border-border-subtle px-3 py-2 text-xs leading-relaxed text-text-mid">
            {composed}
          </p>
        </details>
      )}

      {library.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <h3 className={sidebarHeadingClass}>Library</h3>
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {library.map((p) => (
              <li key={p.id} className="group flex items-center gap-1">
                <button
                  onClick={() => load(p)}
                  className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-2 ${
                    p.id === loadedId ? "bg-surface-2" : ""
                  }`}
                >
                  <span className="block truncate text-sm text-text-primary">{p.title}</span>
                  <span className="block truncate text-xs text-text-dim">{p.draft}</span>
                </button>
                <button
                  onClick={() => remove(p)}
                  aria-label={`Delete “${p.title}”`}
                  title="Delete"
                  className="shrink-0 rounded-md p-1.5 text-text-dim opacity-60 hover:bg-surface-2 hover:text-text-primary group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
