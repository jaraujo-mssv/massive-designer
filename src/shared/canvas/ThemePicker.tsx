import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { CaretLeft, CaretRight, Check } from "@phosphor-icons/react";
import { CANVAS_THEMES, CanvasThemeId, canvasThemeClass } from "./themes";

/** What a tool's theme preview is told about the theme it's drawn in. */
export interface ThemePreviewProps {
  /** Draw the legacy arrangement (columns of cards) rather than the modern one. */
  legacy: boolean;
}

/** Stand-ins for real logos in the previews. */
const MOCK_LOGO_COLORS = ["#f16d65", "#3288bd", "#66c2a5", "#ffad5e", "#ac86f9", "#4d8b8d"];

/** A logo in a preview: a coloured square, picked by `i`. */
export function MockLogo({ size, i, round = false }: { size: number; i: number; round?: boolean }) {
  return (
    <span
      style={{
        display: "block",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: round ? "50%" : Math.max(1, size * 0.25),
        backgroundColor: MOCK_LOGO_COLORS[i % MOCK_LOGO_COLORS.length],
      }}
    />
  );
}

/** A line of text in a preview: a rounded bar. */
export function MockBar({ w, h, color }: { w: number | string; h: number; color: string }) {
  return <span style={{ display: "block", flexShrink: 0, width: w, height: h, borderRadius: h / 2, backgroundColor: color }} />;
}

/** The canvas header in a preview: the title, and the subtitle in red. */
export function MockHeader({ centered = false }: { centered?: boolean }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: centered ? "center" : "flex-start" }}>
      <MockBar w={34} h={4} color="var(--canvas-text)" />
      <MockBar w={22} h={3} color="var(--canvas-red)" />
    </span>
  );
}

/** The box a preview draws in: the card minus a margin, header first. */
export function MockCanvas({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ position: "absolute", inset: 7, display: "flex", flexDirection: "column", gap: 5 }}>{children}</span>
  );
}

/** For tools without a preview of their own: the header over a few cards. */
function GenericPreview() {
  return (
    <MockCanvas>
      <MockHeader />
      <span style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3, backgroundColor: "var(--canvas-card-bg)" }}
          >
            <MockLogo size={8} i={i} />
          </span>
        ))}
      </span>
    </MockCanvas>
  );
}

/** Room kept beside a card scrolled into view, so the edge fade doesn't cover it. */
const EDGE_ROOM = 24;
/** Mouse travel before a press on the row becomes a drag (and no longer picks a card). */
const DRAG_THRESHOLD = 4;

interface ThemePickerProps {
  value: CanvasThemeId;
  onChange: (id: CanvasThemeId) => void;
  /** The tool's mini canvas, drawn in each card under that card's theme. */
  Preview?: React.ComponentType<ThemePreviewProps>;
  /** Id of the label naming the group. */
  labelledBy?: string;
}

/**
 * The themes as a row of cards, each a small live preview drawn with that
 * theme's own `--canvas-*` variables and background, so it always matches the
 * canvas. The row scrolls sideways, and a mouse can drag it; a fade and an
 * arrow show there's more.
 */
export function ThemePicker({ value, onChange, Preview = GenericPreview, labelledBy }: ThemePickerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });
  const scrolledOnce = useRef(false);
  const drag = useRef<{ pointerId: number; startX: number; startScroll: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Set when a drag ends, so the click that follows the release doesn't pick a card.
  const justDragged = useRef(false);

  // Touch already scrolls the row natively; a mouse drags it, when there's anything to scroll.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    justDragged.current = false;
    const el = scrollerRef.current;
    if (!el || e.pointerType === "touch" || e.button !== 0 || el.scrollWidth <= el.clientWidth) return;
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = scrollerRef.current;
    if (!d || !el || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      d.moved = true;
      setDragging(true);
      // Keeps the drag going when the pointer leaves the row.
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = d.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    drag.current = null;
    if (d.moved) {
      justDragged.current = true;
      setDragging(false);
    }
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (!justDragged.current) return;
    justDragged.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const updateMore = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
  };

  // The sidebar (or the phone drawer) changing width changes what's hidden.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateMore();
    const ro = new ResizeObserver(updateMore);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Bring the selected card into view by scrolling the row only: scrollIntoView
  // would scroll the sidebar too. Instant on open, smooth after.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    const card = el?.querySelector<HTMLElement>(`[data-theme-id="${value}"]`);
    if (!el || !card) return;
    const behavior = scrolledOnce.current ? "smooth" : "auto";
    scrolledOnce.current = true;
    const left = card.offsetLeft - EDGE_ROOM;
    const right = card.offsetLeft + card.offsetWidth + EDGE_ROOM;
    if (left < el.scrollLeft) el.scrollTo({ left, behavior });
    else if (right > el.scrollLeft + el.clientWidth) el.scrollTo({ left: right - el.clientWidth, behavior });
  }, [value]);

  const scrollBy = (dir: -1 | 1) => scrollerRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  return (
    <div className="relative">
      <RadioGroup.Root
        ref={scrollerRef}
        value={value}
        onValueChange={(id) => onChange(id as CanvasThemeId)}
        orientation="horizontal"
        loop
        aria-labelledby={labelledBy}
        onScroll={updateMore}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        // A sideways swipe scrolls the row instead of dragging the phone drawer.
        data-vaul-no-drag=""
        // Padding keeps the selected ring from being clipped by the scroll box. No scroll
        // snapping: it would pull a card scrolled part-way into view back out.
        className={`relative flex gap-2 overflow-x-auto no-scrollbar p-1 -m-1 select-none ${
          dragging ? "cursor-grabbing [&_*]:cursor-grabbing" : ""
        }`}
      >
        {CANVAS_THEMES.map((t) => (
          <RadioGroup.Item
            key={t.id}
            value={t.id}
            data-theme-id={t.id}
            className="group shrink-0 w-28 flex flex-col gap-1.5 text-left outline-none cursor-pointer"
          >
            <span
              className={`${canvasThemeClass(t.id)} relative block w-full aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-border-subtle ring-offset-2 ring-offset-surface transition-shadow group-data-[state=unchecked]:group-hover:ring-text-dim group-data-[state=checked]:ring-2 group-data-[state=checked]:ring-brand group-focus-visible:ring-2 group-focus-visible:ring-brand-light`}
              style={{
                backgroundColor: "var(--canvas-bg)",
                backgroundImage: "var(--canvas-export-bg-image)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <span aria-hidden>
                <Preview legacy={t.legacy} />
              </span>
              <span className="absolute top-1 right-1 size-4 rounded-full bg-brand text-white hidden items-center justify-center group-data-[state=checked]:flex">
                <Check size={10} weight="bold" />
              </span>
            </span>
            <span className="text-xs truncate text-text-dim group-data-[state=checked]:text-text-primary group-data-[state=checked]:font-medium">
              {t.label}
            </span>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>

      {more.left && (
        <>
          <div className="absolute inset-y-0 -left-1 w-8 pointer-events-none bg-linear-to-r from-surface to-transparent" />
          <ScrollButton side="left" onClick={() => scrollBy(-1)} />
        </>
      )}
      {more.right && (
        <>
          <div className="absolute inset-y-0 -right-1 w-8 pointer-events-none bg-linear-to-l from-surface to-transparent" />
          <ScrollButton side="right" onClick={() => scrollBy(1)} />
        </>
      )}
    </div>
  );
}

function ScrollButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? CaretLeft : CaretRight;
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={side === "left" ? "Scroll themes left" : "Scroll themes right"}
      onClick={onClick}
      // Centred on the previews (84px tall), not on the cards with their labels.
      className={`absolute top-[42px] -translate-y-1/2 ${side === "left" ? "-left-1" : "-right-1"} size-6 rounded-full flex items-center justify-center bg-surface-2 border border-border-subtle text-text-dim hover:text-text-primary shadow-sm`}
    >
      <Icon size={12} weight="bold" />
    </button>
  );
}
