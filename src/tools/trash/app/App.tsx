import { ImageButton } from "@/tools/content/app/components/Lightbox";

/**
 * The discarded photo takes: every `Image:` in content/<campaign>/trash.md, in file order.
 * Only reachable by URL (/trash); the Content tab leaves trash.md out.
 */
const FILES = import.meta.glob("/content/*/trash.md", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

interface TrashImage {
  src: string;
  /** The item's label, for screen readers only. */
  alt: string;
}

const IMAGES: TrashImage[] = Object.entries(FILES)
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([path, raw]) => {
    const campaign = path.split("/")[2];
    const out: TrashImage[] = [];
    let label = "";
    for (const line of raw.split("\n")) {
      const item = line.match(/^- \[[ xX]\] (.+)$/);
      if (item) label = item[1].trim();
      const image = line.match(/^\s+Image:\s*(\S+)/);
      if (image) out.push({ src: `/content/${campaign}/photos/${image[1]}`, alt: label });
    }
    return out;
  });

/** The page heading from the first trash.md: its `title:` and the first paragraph of its intro. */
function heading(raw: string): { title: string; subtitle: string } {
  const [, front = "", body = raw] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  const title = front.match(/^title:\s*(.+)$/m)?.[1].trim() ?? "Trash";
  const intro = body.split(/\n## /)[0].trim();
  const subtitle = intro.split(/\n\s*\n/)[0].replace(/\s*\n\s*/g, " ").trim();
  return { title, subtitle };
}

const HEADING = heading(Object.entries(FILES).sort(([a], [b]) => a.localeCompare(b))[0]?.[1] ?? "");

export default function App() {
  return (
    <div className="h-full overflow-y-auto bg-bg">
      <header className="space-y-2 px-3 pt-4 md:px-6 md:pt-8">
        <h1 className="text-xl md:text-2xl">{HEADING.title}</h1>
        {HEADING.subtitle && <p className="max-w-3xl text-sm text-text-dim">{HEADING.subtitle}</p>}
      </header>
      <div className="columns-2 gap-3 p-3 md:columns-3 md:p-6 xl:columns-4">
        {IMAGES.map((image) => (
          <ImageButton key={image.src} src={image.src} alt={image.alt} className="mb-3 break-inside-avoid">
            <img src={image.src} alt={image.alt} loading="lazy" className="block w-full rounded-lg bg-surface-2" />
          </ImageButton>
        ))}
      </div>
    </div>
  );
}
