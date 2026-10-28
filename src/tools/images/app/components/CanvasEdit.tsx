import { useEffect, useReducer, useRef, useState } from "react";
import { boxOf, findTargets, targetAt, type Box, type Target } from "../canvasTargets";
import type { FieldValues, ImageField, ImageProject } from "../types";
import { PhotoPopover } from "./PhotoPopover";

/** What editing on the canvas needs from the editor around it. */
export interface CanvasEditHandlers {
  /** Uploaded photos' file names, by field. */
  names: Record<string, string>;
  errors: Record<string, string>;
  onChange: (id: string, value: string | boolean, name?: string) => void;
  /** An uploaded file for an image field. */
  onFile: (id: string, file: File) => void;
}

interface CanvasEditProps extends CanvasEditHandlers {
  frameRef: React.RefObject<HTMLIFrameElement | null>;
  project: ImageProject;
  values: FieldValues;
  scale: number;
  /** Goes up each time the page has applied the values; a new one redraws the boxes on the new layout. */
  version: number;
}

interface Typing {
  field: ImageField;
  el: HTMLElement;
  /** The value it started with, for Esc. */
  original: string;
  /** The element's own inline styles, put back when typing ends. */
  saved: { outline: string; pointerEvents: string };
}

interface Picking {
  field: ImageField;
  el: HTMLElement;
  /** Where the photo was clicked, in page px. */
  at: { x: number; y: number };
}

/** Space between a text and its box, in screen px. */
const GAP = 3;

const textOf = (el: HTMLElement) => (el.textContent ?? "").replace(/ /g, " ");

/** Make the page's element typeable and focus it (in the click itself, so a phone brings up its keyboard). */
function begin(el: HTMLElement): Typing["saved"] {
  const saved = { outline: el.style.outline, pointerEvents: el.style.pointerEvents };
  try {
    el.contentEditable = "plaintext-only";
  } catch {
    el.contentEditable = "true";
  }
  el.spellcheck = false;
  // The red box is drawn by the app; the page's own focus ring would land in the export's DOM.
  el.style.outline = "none";
  // Some pages set text in pointer-events: none layers; the caret has to reach it.
  el.style.pointerEvents = "auto";
  el.focus({ preventScroll: true });
  return saved;
}

function end(el: HTMLElement, saved: Typing["saved"]) {
  el.removeAttribute("contenteditable");
  el.removeAttribute("spellcheck");
  el.style.outline = saved.outline;
  el.style.pointerEvents = saved.pointerEvents;
  if (el.ownerDocument.activeElement === el) el.blur();
}

/** The caret where the text was clicked, or at its end. */
function placeCaret(el: HTMLElement, x: number, y: number) {
  const doc = el.ownerDocument;
  const selection = doc.getSelection();
  if (!selection) return;
  const pos = doc.caretPositionFromPoint?.(x, y);
  const legacy = pos ? null : doc.caretRangeFromPoint?.(x, y);
  const node = pos?.offsetNode ?? legacy?.startContainer;
  const range = doc.createRange();
  if (node && el.contains(node)) range.setStart(node, pos ? pos.offset : legacy!.startOffset);
  else {
    range.selectNodeContents(el);
    range.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Click-to-edit over the preview, the way Market Map and Top List edit their canvas. A layer over the iframe finds
 * the text or photo under the pointer and outlines it. A text is typed into right on the image, in a red box; a
 * photo opens a grid of photos to pick from. The layer, boxes and popover live in the app, not in the page, so
 * none of them can land in the JPG.
 *
 * While typing, the iframe takes the pointer inside the text's box (the layer has a hole there) so clicks and
 * selections reach the text; a click anywhere else still lands on the layer, finishing the text and opening the next.
 */
export function CanvasEdit({ frameRef, project, values, scale, names, errors, onChange, onFile }: CanvasEditProps) {
  const [hover, setHover] = useState<Target | null>(null);
  const [typing, setTyping] = useState<Typing | null>(null);
  const [picking, setPicking] = useState<Picking | null>(null);
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  const lastBox = useRef<Box | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /** What's under the pointer, and where, in page px. */
  const under = (e: React.MouseEvent<HTMLDivElement>) => {
    const doc = frameRef.current?.contentDocument;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / scale;
    const y = (e.clientY - r.top) / scale;
    return { x, y, target: doc ? targetAt(findTargets(doc, project.fields), x, y) : null };
  };

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y, target } = under(e);
    setHover(null);
    if (!target) {
      setTyping(null);
      return;
    }
    if (target.field.type === "image") {
      setTyping(null);
      setPicking({ field: target.field, el: target.el, at: { x, y } });
      return;
    }
    if (typing?.el === target.el) return;
    const saved = begin(target.el);
    placeCaret(target.el, x, y);
    setPicking(null);
    setTyping({ field: target.field, el: target.el, original: String(values[target.field.id] ?? target.field.default), saved });
  };

  // Typing: every keystroke goes to the field (the image, sidebar and address bar follow). Enter or a click
  // elsewhere keeps it; Esc puts back what was there.
  useEffect(() => {
    if (!typing) return;
    const { field, el, original, saved } = typing;
    const frame = frameRef.current;
    const doc = el.ownerDocument;
    const finish = () => setTyping(null);
    const onInput = () => {
      onChangeRef.current(field.id, textOf(el));
      requestAnimationFrame(redraw);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (e.key === "Enter") {
        e.preventDefault();
        finish();
      } else if (e.key === "Escape") {
        e.preventDefault();
        el.textContent = original;
        onChangeRef.current(field.id, original);
        finish();
      }
    };
    // Fields are one line of plain text.
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain").replace(/\s*[\r\n]+\s*/g, " ");
      if (text) doc.execCommand("insertText", false, text);
    };
    // A file dragged over the page would open in the iframe: stop typing and give the pointer back, so the
    // preview's own drop takes it.
    const onDrag = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
      finish();
    };
    el.addEventListener("input", onInput);
    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("paste", onPaste);
    el.addEventListener("blur", finish);
    doc.addEventListener("dragover", onDrag);
    doc.addEventListener("drop", onDrag);
    if (frame) frame.style.pointerEvents = "auto";
    return () => {
      el.removeEventListener("input", onInput);
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("paste", onPaste);
      el.removeEventListener("blur", finish);
      doc.removeEventListener("dragover", onDrag);
      doc.removeEventListener("drop", onDrag);
      if (frame) frame.style.pointerEvents = "";
      end(el, saved);
    };
  }, [typing, frameRef]);

  const active = typing ?? picking;
  let activeBox: Box | null = null;
  if (active) {
    // An emptied text has no box of its own; keep the last one so the box doesn't vanish mid-word.
    activeBox = boxOf(active.el, active.field.type === "text") ?? (typing ? lastBox.current : null);
    lastBox.current = activeBox;
  }
  const hoverBox = hover && hover.el !== active?.el ? boxOf(hover.el, hover.field.type === "text") : null;

  /** A page box on screen; texts get some air, photos are outlined just inside their edge. */
  const place = (b: Box, text: boolean) => {
    const gap = text ? GAP : 0;
    return { left: b.x * scale - gap, top: b.y * scale - gap, width: b.w * scale + gap * 2, height: b.h * scale + gap * 2 };
  };

  const hole = typing && activeBox ? place(activeBox, true) : null;
  const clipPath =
    hole &&
    `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${hole.left}px ${hole.top}px, ${hole.left}px ${hole.top + hole.height}px, ${
      hole.left + hole.width
    }px ${hole.top + hole.height}px, ${hole.left + hole.width}px ${hole.top}px, ${hole.left}px ${hole.top}px)`;

  // A photo's grid opens under it, or where it was clicked when the photo is too tall for that (a full-bleed one).
  const anchorBox =
    picking && activeBox && (activeBox.h <= project.height / 2 ? activeBox : { x: picking.at.x, y: picking.at.y, w: 1, h: 1 });

  return (
    <>
      <div
        className="absolute inset-0 select-none"
        style={{ clipPath: clipPath ?? undefined, cursor: hover ? (hover.field.type === "text" ? "text" : "pointer") : undefined }}
        title={hover?.field.label}
        onPointerMove={(e) => {
          const { target } = under(e);
          setHover((prev) => (prev?.el === target?.el ? prev : target));
        }}
        onPointerLeave={() => setHover(null)}
        onClick={onClick}
      />
      {hoverBox && (
        <div
          className="absolute pointer-events-none rounded-[3px] border-2 border-brand/60"
          style={place(hoverBox, hover!.field.type === "text")}
        />
      )}
      {active && activeBox && (
        <div
          className="absolute pointer-events-none rounded-[3px] border-2 border-brand"
          style={place(activeBox, active.field.type === "text")}
        />
      )}
      {picking && anchorBox && (
        <div ref={setAnchor} className="absolute pointer-events-none" style={place(anchorBox, false)} />
      )}
      {picking && (
        <PhotoPopover
          anchor={anchor}
          project={project}
          field={picking.field}
          value={String(values[picking.field.id] ?? picking.field.default)}
          name={names[picking.field.id]}
          error={errors[picking.field.id]}
          onChange={(value, name) => onChange(picking.field.id, value, name)}
          onFile={(file) => onFile(picking.field.id, file)}
          onClose={() => setPicking(null)}
        />
      )}
    </>
  );
}
