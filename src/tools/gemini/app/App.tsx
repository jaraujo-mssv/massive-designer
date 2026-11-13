import { useEffect, useRef, useState, type DragEvent } from "react";
import { Toaster, toast } from "sonner";
import { loadAsDataUrl } from "@/shared/utils/imageDataUrl";
import { saveFile } from "@/shared/utils/saveFile";
import { copyImage, copyText, imageFiles, imageSize, readClipboardImage, toPng, type PngOptions } from "./clipboard";
import { writeFile } from "./folder";
import { stripUrl, useBlobStore, useFolder, useStored, type RefRecord, type Run, type SavedRecord, type WithUrl } from "./hooks";
import { KIT, KIT_WIDTH, type KitItem } from "./kit";
import { composePrompt, DEFAULT_OPTIONS, type PromptOptions } from "./prompt";
import { AttachTray, CopyNext, INTERNAL_DRAG, type Step, type TrayItem } from "./components/AttachTray";
import { PromptPanel } from "./components/PromptPanel";
import { SavedGallery } from "./components/SavedGallery";
import { WindowsPanel } from "./components/WindowsPanel";

const pad = (n: number) => String(n).padStart(2, "0");
const dayOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeOf = (d: Date) => `${pad(d.getHours())}${pad(d.getMinutes())}`;
/** The prompt's first words, for file names. */
const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 6)
    .join("-")
    .slice(0, 48)
    .replace(/-+$/, "") || "gemini";
const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

const kitPng = (item: KitItem): PngOptions =>
  item.ground ? { width: KIT_WIDTH, fill: item.fill, ground: item.ground } : { maxSide: KIT_WIDTH };

/** The kit drawn as PNGs once, so a click puts one on the clipboard straight away. */
function useKitPngs() {
  const [pngs, setPngs] = useState<Record<string, { blob: Blob; url: string }>>({});
  useEffect(() => {
    let live = true;
    const made: string[] = [];
    for (const item of KIT) {
      toPng(item.src, kitPng(item))
        .then((blob) => {
          if (!live) return;
          const url = URL.createObjectURL(blob);
          made.push(url);
          setPngs((p) => ({ ...p, [item.id]: { blob, url } }));
        })
        .catch(() => {});
    }
    return () => {
      live = false;
      made.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  return pngs;
}

type Attachable = TrayItem & { describe: string };

export default function App() {
  const [draft, setDraft] = useStored("gemini:draft", "", (raw) => (typeof raw === "string" ? raw : ""));
  const [options, setOptions] = useStored<PromptOptions>("gemini:options", DEFAULT_OPTIONS, (raw) => ({
    ...DEFAULT_OPTIONS,
    ...(raw as Partial<PromptOptions>),
  }));
  // The images to attach, in the order they were added to the set.
  const [setKeys, setSetKeys] = useStored<string[]>("gemini:set", [], (raw) =>
    Array.isArray(raw) ? raw.filter((k): k is string => typeof k === "string") : [],
  );
  const [run, setRun] = useStored<Run | null>("gemini:run", null);
  const refs = useBlobStore<RefRecord>("refs");
  const saved = useBlobStore<SavedRecord>("saved");
  const { folder, pick, writable } = useFolder();
  const kitPngs = useKitPngs();
  const [dropTarget, setDropTarget] = useState<null | "saved" | "refs">(null);
  const root = useRef<HTMLDivElement>(null);

  const kitItems: Attachable[] = KIT.map((item) => {
    const png = kitPngs[item.id];
    return {
      key: `kit:${item.id}`,
      label: item.label,
      src: png?.url ?? item.src,
      ground: item.ground,
      describe: item.describe,
      copy: () => copyImage(png ? Promise.resolve(png.blob) : toPng(item.src, kitPng(item))),
    };
  });
  const refItems: Attachable[] = [...refs.items]
    .sort((a, b) => a.addedAt - b.addedAt)
    .map((r) => ({
      key: `ref:${r.id}`,
      label: r.name,
      src: r.url,
      describe: r.name,
      copy: () => copyImage(r.url, { maxSide: 2048 }),
    }));
  const byKey = new Map([...kitItems, ...refItems].map((i) => [i.key, i]));
  // References load a moment after the page, so keys that don't resolve yet are skipped, not dropped.
  const attached = setKeys.flatMap((key) => byKey.get(key) ?? []);
  const composed = composePrompt(draft, options, attached);

  /** The run the next saved images belong to: the current one while the prompt is the same, else a new one. */
  const beginRun = (): Run => {
    if (run && run.prompt === composed) return run;
    const next: Run = { id: crypto.randomUUID(), prompt: composed, draft, options, startedAt: Date.now() };
    setRun(next);
    return next;
  };

  const copyPrompt = async () => {
    if (!composed) {
      toast.error("Write a prompt first.");
      return false;
    }
    try {
      await copyText(composed);
      beginRun();
      return true;
    } catch {
      toast.error("Couldn't copy to the clipboard.");
      return false;
    }
  };

  const steps: Step[] = [
    ...(composed
      ? [
          {
            key: `prompt:${composed}`,
            label: "Prompt",
            copy: async () => {
              await copyText(composed);
              beginRun();
            },
          },
        ]
      : []),
    ...attached.map((a) => ({ key: a.key, label: a.label, copy: a.copy })),
  ];

  const addRefs = (blobs: Blob[], names?: string[]) => {
    if (blobs.length === 0) return;
    const now = Date.now();
    blobs.forEach((blob, i) =>
      refs.put({
        id: crypto.randomUUID(),
        name:
          names?.[i] ??
          (blob instanceof File && blob.name && blob.name !== "image.png"
            ? blob.name.replace(/\.[^.]+$/, "")
            : `Reference ${refs.items.length + i + 1}`),
        blob,
        addedAt: now + i,
      }),
    );
    toast.success(blobs.length === 1 ? "Added to your references" : `Added ${blobs.length} references`);
  };

  const pasteRef = async () => {
    try {
      const blob = await readClipboardImage();
      if (blob) addRefs([blob]);
      else toast.error("There's no image on the clipboard.");
    } catch {
      toast.error("Couldn't read the clipboard here. Drop the photo on the references instead.");
    }
  };

  const findRef = (key: string) => refs.items.find((r) => `ref:${r.id}` === key);
  const renameRef = (key: string, name: string) => {
    const ref = findRef(key);
    if (ref) refs.put({ ...stripUrl<RefRecord>(ref), name });
  };
  const removeRef = (key: string) => {
    const ref = findRef(key);
    if (!ref) return;
    const row = stripUrl<RefRecord>(ref);
    const wasInSet = setKeys.includes(key);
    refs.remove(ref.id);
    setSetKeys((keys) => keys.filter((k) => k !== key));
    toast(`Removed “${ref.name}”`, {
      action: {
        label: "Undo",
        onClick: () => {
          refs.put(row);
          if (wasInSet) setSetKeys((keys) => [...keys, key]);
        },
      },
    });
  };

  const toggle = (key: string) =>
    setSetKeys((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));

  /** Saves images brought back from Gemini: to the gallery, and to the folder when there is one. */
  const saveResults = async (blobs: Blob[]) => {
    if (blobs.length === 0) return;
    const current = run ?? beginRun();
    const started = new Date(current.startedAt);
    const base = `${timeOf(started)}-${slug(current.draft || current.prompt)}`;
    let count = saved.items.filter((s) => s.run.id === current.id).length;
    const dir = await writable();
    // Asks the browser not to clear the gallery when space runs low; it decides without a prompt.
    navigator.storage?.persist?.().catch(() => {});
    for (const blob of blobs) {
      const n = ++count;
      const fileName = `${base}-${n}.${EXTENSIONS[blob.type] ?? "png"}`;
      let path: string | undefined;
      if (dir) {
        try {
          path = `${dir.name}/${await writeFile(dir, dayOf(started), fileName, blob)}`;
          if (current.prompt) {
            const prompt = new Blob([`${current.prompt}\n`], { type: "text/plain" });
            await writeFile(dir, dayOf(started), `${base}.txt`, prompt, { onlyIfNew: true });
          }
        } catch {
          toast.error(`Couldn't write to ${dir.name}. The image is in the gallery.`);
        }
      } else if (folder.status === "unsupported") {
        await saveFile(blob, fileName);
      }
      const { width, height } = await imageSize(blob);
      const record: SavedRecord = {
        id: crypto.randomUUID(),
        run: current,
        blob,
        fileName: path ? path.slice(path.lastIndexOf("/") + 1) : fileName,
        path,
        width,
        height,
        savedAt: Date.now(),
      };
      saved.put(record);
      toast.success(path ? `Saved to ${path}` : "Saved to the gallery", {
        description:
          folder.status === "none"
            ? "Pick a folder to save the files there too."
            : folder.status === "prompt" && !dir
              ? "Allow saving to the folder to write the file there too."
              : undefined,
        action: {
          label: "Make it a reference",
          onClick: () => {
            saved.remove(record.id);
            addRefs([blob], [`From Gemini ${n}`]);
          },
        },
      });
    }
  };

  const saveLink = async (link: string) => {
    const data = await loadAsDataUrl(link);
    if (!data.startsWith("data:")) {
      toast.error("Couldn't get that image. Copy it in Gemini and paste it here instead.");
      return;
    }
    await saveResults([await (await fetch(data)).blob()]);
  };

  const pasteResult = async () => {
    try {
      const blob = await readClipboardImage();
      if (blob) await saveResults([blob]);
      else toast.error("There's no image on the clipboard.");
    } catch {
      toast.error("Couldn't read the clipboard here. Press ⌘V or Ctrl+V instead.");
    }
  };

  const removeSaved = (item: WithUrl<SavedRecord>) => {
    const row = stripUrl<SavedRecord>(item);
    saved.remove(item.id);
    toast("Removed from the gallery", {
      description: item.path ? "The file is still in the folder." : undefined,
      action: { label: "Undo", onClick: () => saved.put(row) },
    });
  };

  const loadRun = (r: Run) => {
    setDraft(r.draft);
    setOptions({ ...DEFAULT_OPTIONS, ...r.options });
    root.current?.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Loaded into the editor");
  };

  // ⌘V anywhere saves an image, except text pasted into a field.
  const latestSave = useRef(saveResults);
  latestSave.current = saveResults;
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = imageFiles(e.clipboardData);
      if (files.length === 0) return;
      const field = (e.target as HTMLElement | null)?.closest?.("input, textarea, [contenteditable]");
      if (field && e.clipboardData?.types.includes("text/plain")) return;
      e.preventDefault();
      void latestSave.current(files);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  // Files and links dropped anywhere are saved. Text (moved within the prompt) is left to the browser.
  const carriesImage = (types: readonly string[]) => types.includes("Files") || types.includes("text/uri-list");

  const onDragOver = (e: DragEvent) => {
    const types = e.dataTransfer.types;
    if (types.includes(INTERNAL_DRAG)) {
      // This page's own images go nowhere when dropped on it (the browser would open them).
      e.preventDefault();
      e.dataTransfer.dropEffect = "none";
      return;
    }
    if (!carriesImage(types)) return;
    e.preventDefault();
    if (dropTarget !== "saved") setDropTarget("saved");
  };

  const onDrop = (e: DragEvent) => {
    const types = e.dataTransfer.types;
    if (!types.includes(INTERNAL_DRAG) && !carriesImage(types)) return;
    e.preventDefault();
    setDropTarget(null);
    if (types.includes(INTERNAL_DRAG)) return;
    const files = imageFiles(e.dataTransfer);
    if (files.length > 0) return void saveResults(files);
    const link = e.dataTransfer
      .getData("text/uri-list")
      .split(/\r?\n/)
      .find((l) => l && !l.startsWith("#"));
    if (link) return void saveLink(link);
    toast.error("That isn't an image.");
  };

  return (
    <div
      ref={root}
      onDragOver={onDragOver}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropTarget(null);
      }}
      onDrop={onDrop}
      className="relative h-full overflow-y-auto bg-bg"
    >
      <div className="mx-auto grid max-w-6xl gap-4 p-3 md:p-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <WindowsPanel />
          <PromptPanel
            draft={draft}
            onDraftChange={setDraft}
            options={options}
            onOptionsChange={setOptions}
            composed={composed}
            onCopy={copyPrompt}
          />
        </div>
        <div className="min-w-0 space-y-4">
          <AttachTray
            kit={kitItems}
            refs={refItems}
            setKeys={attached.map((a) => a.key)}
            onToggle={toggle}
            onAddRefs={(files) => addRefs(files)}
            onRenameRef={renameRef}
            onRemoveRef={removeRef}
            onPasteRef={pasteRef}
            refsPersistent={refs.persistent}
            dropActive={dropTarget === "refs"}
            onDropActive={(active) => setDropTarget(active ? "refs" : null)}
          />
          <SavedGallery
            saved={saved.items}
            persistent={saved.persistent}
            folder={folder}
            onPick={() => void pick().catch(() => toast.error("Couldn't open that folder."))}
            onReconnect={() => void writable()}
            onPaste={pasteResult}
            onCopyRunPrompt={setRun}
            onLoadRun={loadRun}
            onUseAsRef={(item) => addRefs([item.blob], ["From Gemini"])}
            onRemove={removeSaved}
          />
        </div>
      </div>

      <CopyNext steps={steps} />

      {dropTarget === "saved" && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-end justify-center border-2 border-dashed border-brand/60 pb-20">
          <span className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">Drop to save it</span>
        </div>
      )}
      <Toaster position="top-center" richColors />
    </div>
  );
}
