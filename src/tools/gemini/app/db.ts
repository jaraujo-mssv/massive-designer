/**
 * The tab's own IndexedDB: the reference photos, the saved images and the save
 * folder's handle. Images are too big for localStorage (about 5 MB in all), and
 * a folder handle can only be kept here. Every call can fail (a private window,
 * blocked site data), so callers catch and carry on without it.
 */
const DB_NAME = "massive-gemini";
const VERSION = 1;

export type StoreName = "refs" | "saved" | "kv";

let opening: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!opening) {
    opening = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("refs")) db.createObjectStore("refs", { keyPath: "id" });
        if (!db.objectStoreNames.contains("saved")) db.createObjectStore("saved", { keyPath: "id" });
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).catch((err) => {
      // Try again next time rather than keep a failed open.
      opening = null;
      throw err;
    });
  }
  return opening;
}

async function request<T>(store: StoreName, mode: IDBTransactionMode, make: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const req = make(db.transaction(store, mode).objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const dbAll = <T>(store: StoreName) => request<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>);
export const dbGet = <T>(store: StoreName, key: string) =>
  request<T | undefined>(store, "readonly", (s) => s.get(key) as IDBRequest<T | undefined>);
/** `key` only for `kv`; the other stores key on the value's `id`. */
export const dbPut = (store: StoreName, value: unknown, key?: string) =>
  request(store, "readwrite", (s) => (key === undefined ? s.put(value) : s.put(value, key)));
export const dbDelete = (store: StoreName, key: string) => request(store, "readwrite", (s) => s.delete(key));
