import { useEffect, useState } from "react";
import { VARIANTS_URL } from "../constants";
import type { VideoVariant } from "../types";

interface VariantsResponse {
  [projectId: string]: { dir: string; renderName: string; items: { id: string; variables: Record<string, unknown> }[] };
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/**
 * Per-person versions of templates (e.g. each new hire's welcome video), keyed by project id.
 * Served by the dev server only (vite.config.ts `videoVariantsPlugin`), so the deployed site gets none:
 * there the SPA fallback answers with index.html, which fails to parse and yields {}.
 */
export function useVideoVariants(): Record<string, VideoVariant[]> {
  const [variants, setVariants] = useState<Record<string, VideoVariant[]>>({});

  useEffect(() => {
    let cancelled = false;
    fetch(VARIANTS_URL, { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<VariantsResponse>) : {}))
      .then((data: VariantsResponse) => {
        if (cancelled) return;
        const out: Record<string, VideoVariant[]> = {};
        for (const [projectId, { dir, renderName, items }] of Object.entries(data)) {
          out[projectId] = items.map(({ id, variables }) => ({
            id,
            projectId,
            title: str(variables.fullName) ?? str(variables.firstName) ?? id,
            subtitle: [str(variables.role), str(variables.location)].filter(Boolean).join(" · ") || null,
            variables,
            file: `${dir}/${id}.json`,
            renderName: renderName.replace("{id}", id),
          }));
        }
        setVariants(out);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return variants;
}
