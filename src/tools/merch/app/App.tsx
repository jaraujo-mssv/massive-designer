import { useEffect, useState, type CSSProperties } from "react";
import { ArrowSquareOut, DownloadSimple, ListBullets } from "@phosphor-icons/react";
import { SidebarLayout } from "@/shared/components/SidebarLayout";
import { PRODUCTS, PROOF_PDF, mockupUrl, pdfUrl, pngUrl, svgUrl, type MerchDesign, type MerchProduct } from "./products";

/** A round design's guides over its print file: the bleed dimmed, the face dashed, the safe line dotted. */
function Guides({ guides }: { guides: NonNullable<MerchProduct["guides"]> }) {
  const face = (guides.face / guides.art) * 100;
  const circle = (diameter: number, style: string) => {
    const size = (diameter / guides.art) * 100;
    return (
      <span
        aria-hidden
        className={`pointer-events-none absolute rounded-full border border-brand-light/80 ${style}`}
        style={{ width: `${size}%`, height: `${size}%`, left: `${(100 - size) / 2}%`, top: `${(100 - size) / 2}%` }}
      />
    );
  };
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle closest-side, transparent ${face}%, rgba(18, 17, 23, 0.72) ${face}%)` }}
      />
      {circle(guides.face, "border-dashed")}
      {circle(guides.safe, "border-dotted opacity-60")}
    </>
  );
}

function FileLink({ href, download, label }: { href: string; download: string; label: string }) {
  return (
    <a
      href={href}
      download={download}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-mono text-[0.7rem] text-text-mid hover:bg-surface-2 hover:text-text-primary"
    >
      <DownloadSimple size={12} weight="bold" />
      {label}
    </a>
  );
}

/** The usual grey checkerboard behind every preview, so the die-cut designs' transparent parts show as transparent */
const CHECKERBOARD: CSSProperties = {
  backgroundImage: "conic-gradient(#b8b8bd 25%, #9e9ea4 0 50%, #b8b8bd 0 75%, #9e9ea4 0)",
  backgroundSize: "16px 16px",
};

function DesignCard({ product, design }: { product: MerchProduct; design: MerchDesign }) {
  return (
    <figure className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-2">
      <div
        className={`flex items-center justify-center rounded-md p-3 ${product.wide ? "aspect-[2/1]" : "aspect-square"}`}
        style={CHECKERBOARD}
      >
        <div className="relative w-full">
          <img
            src={pngUrl(design.file)}
            alt={`${product.name}, ${design.name}`}
            loading="lazy"
            className="block h-auto w-full"
          />
          {product.guides && <Guides guides={product.guides} />}
        </div>
      </div>
      <figcaption className="flex flex-col gap-0.5 px-1">
        <span className="truncate font-mono text-xs text-text-primary">{design.name}</span>
        <span className="-ml-1.5 flex">
          <FileLink href={pdfUrl(design.file)} download={`massive-${design.file}.pdf`} label="PDF" />
          <FileLink href={pngUrl(design.file)} download={`massive-${design.file}.png`} label="PNG" />
          {product.svg && <FileLink href={svgUrl(design.file)} download={`massive-${design.file}.svg`} label="SVG" />}
        </span>
      </figcaption>
    </figure>
  );
}

/** The product's desk photo from `npm run merch:mockups`, kept in view beside its designs on wide screens. */
function Mockup({ product, onMissing }: { product: MerchProduct; onMissing: () => void }) {
  return (
    <figure className="space-y-1 lg:sticky lg:top-6">
      <img
        src={mockupUrl(product.id)}
        alt={`Mockup: the ${product.name} designs on a desk, next to stationery for scale`}
        loading="lazy"
        onError={onMissing}
        className="block aspect-[3/2] h-auto w-full rounded-lg bg-surface-2 object-cover"
      />
      <figcaption className="-ml-1.5">
        <FileLink href={mockupUrl(product.id)} download={`massive-${product.id}-mockup.jpg`} label="Mockup (JPG)" />
      </figcaption>
    </figure>
  );
}

const sectionId = (id: string) => `merch-${id}`;

/** One entry per product, each a jump to its section. `active` is the section in view. */
function SectionList({ active, onJump }: { active: string; onJump: (id: string) => void }) {
  return (
    <nav aria-label="Merch sections" className="p-2">
      {PRODUCTS.map((product) => (
        <button
          key={product.id}
          onClick={() => onJump(product.id)}
          aria-current={product.id === active ? "location" : undefined}
          className={`flex w-full flex-col rounded-lg border px-2.5 py-2 text-left transition-colors ${
            product.id === active ? "border-brand/30 bg-surface-2" : "border-transparent hover:bg-surface-2"
          }`}
        >
          <span className="truncate text-sm text-text-primary">{product.name}</span>
          <span className="truncate font-mono text-[10px] text-text-dim">
            {[`${product.designs.length} designs`, product.vendor?.name].filter(Boolean).join(" · ")}
          </span>
        </button>
      ))}
    </nav>
  );
}

function ProductSection({ product }: { product: MerchProduct }) {
  // Wide screens: the mockup on the left, the downloads on the right. A product that hasn't had a mockup made
  // gives the downloads the whole width.
  const [hasMockup, setHasMockup] = useState(true);
  const columns = product.wide
    ? `grid-cols-1 sm:grid-cols-2 ${hasMockup ? "" : "lg:grid-cols-4"}`
    : `grid-cols-2 sm:grid-cols-3 ${hasMockup ? "" : "lg:grid-cols-6"}`;
  return (
    <section id={sectionId(product.id)} className="space-y-3 border-t border-border-subtle px-3 py-5 md:px-6 md:py-7">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-lg md:text-xl">{product.name}</h2>
        {product.vendor && (
          <a
            href={product.vendor.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-brand-light hover:underline"
          >
            {product.vendor.name}
            <ArrowSquareOut size={12} weight="bold" />
          </a>
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {product.specs.map((spec) => (
          <li key={spec} className="font-mono text-xs text-text-dim">
            {spec}
          </li>
        ))}
      </ul>
      <p className="max-w-3xl text-sm text-text-mid">{product.notes}</p>
      <div className={`grid gap-4 pt-1 lg:gap-6 ${hasMockup ? "lg:grid-cols-2 lg:items-start" : ""}`}>
        {hasMockup && <Mockup product={product} onMissing={() => setHasMockup(false)} />}
        <div className={`grid gap-3 ${columns}`}>
          {product.designs.map((design) => (
            <DesignCard key={design.file} product={product} design={design} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Print files for Massive buttons and pins, made by `npm run merch` from scripts/merch/merch.html.
 * Each design downloads as a vector PDF (what the vendors want) or a 600 dpi PNG.
 */
export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState(PRODUCTS[0].id);
  // State, not a ref: phones and desktop draw the main area in different trees, so it remounts.
  const [main, setMain] = useState<HTMLDivElement | null>(null);

  // The section in view is the last one whose top is above a third of the way down, or the last one once
  // the page is scrolled to the bottom (it may be too short to reach that line).
  useEffect(() => {
    if (!main) return;
    const onScroll = () => {
      const line = main.getBoundingClientRect().top + main.clientHeight / 3;
      const atBottom = main.scrollTop > 0 && main.scrollTop + main.clientHeight >= main.scrollHeight - 2;
      let current = PRODUCTS[0].id;
      for (const product of PRODUCTS) {
        const top = document.getElementById(sectionId(product.id))?.getBoundingClientRect().top;
        if (top !== undefined && top <= line) current = product.id;
      }
      setActive(atBottom ? PRODUCTS[PRODUCTS.length - 1].id : current);
    };
    onScroll();
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, [main]);

  const jump = (id: string) => {
    setDrawerOpen(false);
    document.getElementById(sectionId(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const list = <SectionList active={active} onJump={jump} />;

  return (
    <SidebarLayout
      sidebar={
        <div className="flex w-80 shrink-0 flex-col border-r border-border-subtle bg-surface">
          <div className="flex shrink-0 items-center border-b border-border-subtle px-4 py-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-text-dim">Merch</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{list}</div>
        </div>
      }
      drawerTitle="Merch"
      drawerContent={list}
      drawerOpen={drawerOpen}
      onDrawerOpenChange={setDrawerOpen}
      editLabel="Sections"
      editIcon={ListBullets}
    >
      <div ref={setMain} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <header className="space-y-3 px-3 pt-4 pb-5 md:px-6 md:pt-8 md:pb-7">
          <h1 className="text-xl md:text-2xl">Merch</h1>
          <p className="max-w-3xl text-sm text-text-dim">
            Print files for Massive buttons, pins and stickers: the logo, the mountain and It’s Massive. Each one is
            sized to its vendor’s template, ready to upload.
          </p>
          <a
            href={PROOF_PDF}
            download="massive-merch-proof.pdf"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <DownloadSimple size={16} weight="bold" />
            Proof sheet (PDF)
          </a>
        </header>
        {PRODUCTS.map((product) => (
          <ProductSection key={product.id} product={product} />
        ))}
      </div>
    </SidebarLayout>
  );
}
