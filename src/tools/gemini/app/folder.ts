import { dbGet, dbPut } from "./db";

/**
 * The folder the saved images are written to, picked once. Chrome and Edge only
 * (the File System Access API); the handle is kept in IndexedDB, and on a later
 * visit the browser may want a click to allow writing again.
 */
type Mode = { mode: "readwrite" };
export type FolderHandle = FileSystemDirectoryHandle & {
  queryPermission(descriptor: Mode): Promise<PermissionState>;
  requestPermission(descriptor: Mode): Promise<PermissionState>;
};
type DirectoryPicker = (options?: { id?: string; mode?: "readwrite" }) => Promise<FolderHandle>;

const picker = () => (window as Window & { showDirectoryPicker?: DirectoryPicker }).showDirectoryPicker;

export const canPickFolder = () => typeof window !== "undefined" && !!picker();

const KEY = "folder";
const WRITE: Mode = { mode: "readwrite" };

/** Asks for a folder; null when the person closes the dialog. */
export async function pickFolder(): Promise<FolderHandle | null> {
  try {
    const handle = await picker()!({ id: "massive-gemini", mode: "readwrite" });
    await dbPut("kv", handle, KEY).catch(() => {});
    return handle;
  } catch (err) {
    if ((err as Error).name === "AbortError") return null;
    throw err;
  }
}

/** The folder picked last time, and whether writing to it is still allowed. */
export async function storedFolder(): Promise<{ handle: FolderHandle; granted: boolean } | null> {
  if (!canPickFolder()) return null;
  const handle = await dbGet<FolderHandle>("kv", KEY).catch(() => undefined);
  if (!handle) return null;
  const state = await handle.queryPermission(WRITE).catch(() => "denied" as PermissionState);
  return { handle, granted: state === "granted" };
}

/** Needs a click (or a key press) to show the browser's prompt. */
export async function allowWriting(handle: FolderHandle): Promise<boolean> {
  try {
    return (await handle.requestPermission(WRITE)) === "granted";
  } catch {
    return false;
  }
}

async function exists(dir: FileSystemDirectoryHandle, name: string): Promise<boolean> {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

/** `name` or, when that's taken, `name-2`, `name-3`, … : nothing already there is overwritten. */
async function freeName(dir: FileSystemDirectoryHandle, name: string): Promise<string> {
  const dot = name.lastIndexOf(".");
  const [base, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
  let candidate = name;
  for (let n = 2; await exists(dir, candidate); n++) candidate = `${base}-${n}${ext}`;
  return candidate;
}

/**
 * Writes `blob` as `<subfolder>/<name>` and returns the path it got. With
 * `onlyIfNew`, a file already at that name is left alone (the run's prompt file).
 */
export async function writeFile(
  root: FolderHandle,
  subfolder: string,
  name: string,
  blob: Blob,
  { onlyIfNew = false } = {},
): Promise<string> {
  const dir = await root.getDirectoryHandle(subfolder, { create: true });
  if (onlyIfNew && (await exists(dir, name))) return `${subfolder}/${name}`;
  const fileName = onlyIfNew ? name : await freeName(dir, name);
  const writable = await (await dir.getFileHandle(fileName, { create: true })).createWritable();
  await writable.write(blob);
  await writable.close();
  return `${subfolder}/${fileName}`;
}
