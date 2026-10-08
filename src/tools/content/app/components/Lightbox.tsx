import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";

interface Shown {
  src: string;
  alt: string;
  caption?: string;
}

/**
 * Every image on the page that opens in the lightbox, in page order: the photos of
 * the open doc, or a person's reference images. ←/→ step through these.
 */
const pageImages = (): Shown[] =>
  Array.from(document.querySelectorAll<HTMLElement>("[data-lightbox-src]")).map((el) => ({
    src: el.dataset.lightboxSrc!,
    alt: el.dataset.lightboxAlt ?? "",
    caption: el.dataset.lightboxCaption,
  }));

/** Images full screen, one at a time: ←/→ to step, Esc, a click anywhere or the close button to shut it. */
function Lightbox({ images, start, onClose }: { images: Shown[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const last = images.length - 1;
  const image = images[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(last, i + 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    // The page underneath shouldn't scroll while the image covers it.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [last, onClose]);

  // The buttons step without closing; a click anywhere else closes.
  const step = (to: number) => (e: MouseEvent) => {
    e.stopPropagation();
    setIndex(to);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal
      aria-label={image.alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex cursor-zoom-out flex-col items-center justify-center gap-3 bg-black/95 p-4"
    >
      <img src={image.src} alt={image.alt} className="max-h-[calc(100vh-6rem)] max-w-full rounded-lg object-contain" />
      <div className="flex items-center gap-3 font-mono text-xs text-text-dim">
        {last > 0 && (
          <button onClick={step(Math.max(0, index - 1))} disabled={index === 0} aria-label="Previous image" className="cursor-pointer rounded-lg p-2 hover:bg-surface-2 hover:text-text-primary disabled:opacity-30">
            <CaretLeft size={16} weight="bold" />
          </button>
        )}
        <span className="min-w-24 text-center">
          {image.caption}
          {last > 0 && (
            <span className="ml-2 text-text-dim/60">
              {index + 1} / {last + 1}
            </span>
          )}
        </span>
        {last > 0 && (
          <button onClick={step(Math.min(last, index + 1))} disabled={index === last} aria-label="Next image" className="cursor-pointer rounded-lg p-2 hover:bg-surface-2 hover:text-text-primary disabled:opacity-30">
            <CaretRight size={16} weight="bold" />
          </button>
        )}
      </div>
      <button onClick={onClose} aria-label="Close image" className="absolute right-4 top-4 rounded-lg p-2 text-text-dim hover:bg-surface-2 hover:text-text-primary">
        <X size={16} weight="bold" />
      </button>
    </div>,
    document.body,
  );
}

/** An image (the children) that opens full screen in a lightbox when clicked, instead of in a new tab. */
export function ImageButton({
  src,
  alt,
  caption,
  title,
  className = "",
  children,
}: {
  src: string;
  alt: string;
  caption?: string;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState<{ images: Shown[]; start: number } | null>(null);
  const show = () => {
    const images = pageImages();
    const start = images.findIndex((i) => i.src === src);
    setOpen(start >= 0 ? { images, start } : { images: [{ src, alt, caption }], start: 0 });
  };
  return (
    <>
      <button
        type="button"
        onClick={show}
        title={title}
        data-lightbox-src={src}
        data-lightbox-alt={alt}
        data-lightbox-caption={caption}
        className={`block w-full cursor-zoom-in text-left ${className}`}
      >
        {children}
      </button>
      {open && <Lightbox images={open.images} start={open.start} onClose={() => setOpen(null)} />}
    </>
  );
}
