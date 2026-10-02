import { useCallback, useState } from "react";
import { toast } from "sonner";
import { WRITE_URL } from "../constants";
import type { ChecklistItem, ContentDoc, DocStatus } from "../types";

/**
 * Writes back to the .md files, through the dev server (contentWritePlugin in
 * vite.config.ts). The deployed site has no such endpoint, so there the
 * checkboxes and status are read-only.
 *
 * Nothing is kept on the client: the write changes the file, Vite hot-reloads
 * content.ts, and the UI shows the file as it now is.
 */
export const CAN_WRITE = import.meta.env.DEV;

async function post(route: string, body: unknown) {
  const res = await fetch(`${WRITE_URL}/${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text()) || `${res.status}`);
}

export function useContentWrite() {
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(async (id: string, route: string, body: unknown) => {
    setPending(id);
    try {
      await post(route, body);
    } catch (err) {
      toast.error(`Couldn't save: ${(err as Error).message}`);
    } finally {
      setPending(null);
    }
  }, []);

  const toggle = useCallback(
    (doc: ContentDoc, item: ChecklistItem) =>
      run(`${doc.path}:${item.line}`, "checklist", {
        path: doc.path,
        line: item.line,
        source: item.source,
        checked: !item.checked,
      }),
    [run],
  );

  const setStatus = useCallback(
    (doc: ContentDoc, status: DocStatus) => run(`${doc.path}:status`, "status", { path: doc.path, status }),
    [run],
  );

  /** Whether this item (or the doc's status, with no item) is being saved. */
  const isPending = (doc: ContentDoc, item?: ChecklistItem) =>
    pending === `${doc.path}:${item ? item.line : "status"}`;

  return { canWrite: CAN_WRITE, toggle, setStatus, isPending };
}
