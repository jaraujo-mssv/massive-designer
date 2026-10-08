import { refUrl } from "../content";
import { ImageButton } from "./Lightbox";

/** A doc's reference images, from `public/content/<campaign>/refs/`, each with what it's for. */
export function RefImages({ campaign, refs }: { campaign: string; refs: { file: string; use: string }[] }) {
  if (refs.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-dim">Reference images</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {refs.map((r) => (
          <ImageButton key={r.file} src={refUrl(campaign, r.file)} alt={r.use} caption={r.file} className="group">
            <img
              src={refUrl(campaign, r.file)}
              alt={r.use}
              className="aspect-square w-full rounded-lg border border-border-subtle bg-surface-2 object-cover object-top transition group-hover:border-brand"
            />
            <span className="mt-1 block font-mono text-[10px] text-text-dim">{r.file}</span>
            <span className="block text-xs text-text-mid">{r.use}</span>
          </ImageButton>
        ))}
      </div>
    </section>
  );
}
