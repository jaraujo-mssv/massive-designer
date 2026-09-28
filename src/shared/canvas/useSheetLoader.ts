import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { fetchGoogleSheetTsv } from "@/shared/utils/googleSheets";

/**
 * Loading Google Sheets into a sheet-driven tool.
 *
 * Returns `loadSheet(urlOrId, source?)`, which fetches the sheet as TSV and
 * hands it to `loadText`, with loading and error toasts. On open it also loads
 * `?e=<sheet url or id>` (the dashboard's "Open in editor" links this way).
 * `loadText` must be stable (useCallback).
 */
export function useSheetLoader(
  loadText: (text: string, delimiter: string | undefined, source: string) => void,
) {
  const loadSheet = useCallback(
    async (urlOrId: string, source = "Google Sheets") => {
      const toastId = toast.loading(`Loading data from ${source}...`);
      try {
        const text = await fetchGoogleSheetTsv(urlOrId);
        toast.dismiss(toastId);
        loadText(text, "\t", source);
      } catch (error) {
        toast.dismiss(toastId);
        toast.error(`Failed to import: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    },
    [loadText],
  );

  useEffect(() => {
    const sheet = new URLSearchParams(window.location.search).get("e");
    if (sheet) loadSheet(sheet);
  }, [loadSheet]);

  return loadSheet;
}

/** Drops `?e=` from the address, so a refresh after unloading doesn't load the sheet again. */
export function clearSheetParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("e")) return;
  url.searchParams.delete("e");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}
