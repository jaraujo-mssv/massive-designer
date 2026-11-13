import { useCallback, useEffect, useRef, useState } from "react";
import { dbAll, dbDelete, dbPut } from "./db";
import { allowWriting, canPickFolder, pickFolder, storedFolder, type FolderHandle } from "./folder";
import type { PromptOptions } from "./prompt";

/** One prompt as it was copied: the images saved after that belong to it. */
export interface Run {
  id: string;
  /** The full prompt that was copied. */
  prompt: string;
  /** What was written and the options, to load it back into the editor. */
  draft: string;
  options: PromptOptions;
  startedAt: number;
}

export interface RefRecord {
  id: string;
  name: string;
  blob: Blob;
  addedAt: number;
}

export interface SavedRecord {
  id: string;
  run: Run;
  blob: Blob;
  fileName: string;
  /** Where it was written in the save folder, when it was. */
  path?: string;
  width: number;
  height: number;
  savedAt: number;
}

export type WithUrl<T> = T & { url: string };

/** A JSON value in localStorage. Reads and writes are wrapped: storage can be off or full. */
export function useStored<T>(key: string, fallback: T, read: (raw: unknown) => T = (raw) => raw as T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : read(JSON.parse(raw));
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Not kept; it still works for this visit.
    }
  }, [key, value]);
  return [value, setValue] as const;
}

/**
 * The records of one IndexedDB store, each with an object URL for its blob.
 * `persistent` turns false when the browser won't keep them (they still work until the page closes).
 */
export function useBlobStore<T extends { id: string; blob: Blob }>(store: "refs" | "saved") {
  const [items, setItems] = useState<WithUrl<T>[]>([]);
  const [persistent, setPersistent] = useState(true);
  const urls = useRef(new Map<string, string>());

  const withUrl = useCallback((row: T): WithUrl<T> => {
    let url = urls.current.get(row.id);
    if (!url) {
      url = URL.createObjectURL(row.blob);
      urls.current.set(row.id, url);
    }
    return { ...row, url };
  }, []);

  useEffect(() => {
    let live = true;
    const made = urls.current;
    dbAll<T>(store)
      .then((rows) => live && setItems(rows.map(withUrl)))
      .catch(() => live && setPersistent(false));
    return () => {
      live = false;
      made.forEach((url) => URL.revokeObjectURL(url));
      made.clear();
    };
  }, [store, withUrl]);

  /** Adds a record, or replaces the one with its id. */
  const put = useCallback(
    (row: T) => {
      const next = withUrl(row);
      setItems((prev) => (prev.some((p) => p.id === row.id) ? prev.map((p) => (p.id === row.id ? next : p)) : [...prev, next]));
      dbPut(store, row).catch(() => setPersistent(false));
    },
    [store, withUrl],
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((p) => p.id !== id));
      const url = urls.current.get(id);
      if (url) {
        URL.revokeObjectURL(url);
        urls.current.delete(id);
      }
      dbDelete(store, id).catch(() => {});
    },
    [store],
  );

  return { items, put, remove, persistent };
}

/** A record without its object URL, as it's stored. */
export function stripUrl<T>({ url: _url, ...row }: WithUrl<T>): T {
  return row as T;
}

export type Folder =
  | { status: "unsupported" }
  | { status: "loading" }
  | { status: "none" }
  | { status: "granted" | "prompt"; handle: FolderHandle };

/** The save folder: none yet, connected, or picked before but waiting for a click to allow writing. */
export function useFolder() {
  const [folder, setFolder] = useState<Folder>(() => (canPickFolder() ? { status: "loading" } : { status: "unsupported" }));

  useEffect(() => {
    if (!canPickFolder()) return;
    storedFolder()
      .then((found) => setFolder(found ? { status: found.granted ? "granted" : "prompt", handle: found.handle } : { status: "none" }))
      .catch(() => setFolder({ status: "none" }));
  }, []);

  const pick = useCallback(async () => {
    const handle = await pickFolder();
    if (handle) setFolder({ status: "granted", handle });
    return handle;
  }, []);

  /** The folder ready to write to, asking the browser again if it needs to; null when there's none. */
  const writable = useCallback(async (): Promise<FolderHandle | null> => {
    if (folder.status === "granted") return folder.handle;
    if (folder.status !== "prompt") return null;
    const ok = await allowWriting(folder.handle);
    if (ok) setFolder({ status: "granted", handle: folder.handle });
    return ok ? folder.handle : null;
  }, [folder]);

  return { folder, pick, writable };
}
