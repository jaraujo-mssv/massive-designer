import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { domToJpeg } from "modern-screenshot";
import { useFitScale } from "@/shared/canvas/useFitScale";
import type { FieldValues, ImageProject } from "../types";

export interface PreviewHandle {
  /** The image as a 2× JPEG blob, once the page has applied the current values. */
  exportJpg: () => Promise<Blob>;
}

interface PreviewPaneProps {
  project: ImageProject;
  values: FieldValues;
}

type KitMessage = { type: "image-kit:ready" } | { type: "image-kit:applied" };

/**
 * The project's page in a same-origin iframe at its native size, scaled to fit.
 * Field values go to the page's image-kit by postMessage; the export captures the
 * page's #canvas straight from the iframe's document, so its own fonts and styles come along.
 */
export const PreviewPane = forwardRef<PreviewHandle, PreviewPaneProps>(function PreviewPane({ project, values }, ref) {
  const areaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const applied = useRef<(() => void)[]>([]);
  const scale = useFitScale(areaRef, project.width, project.height);

  const send = useCallback(
    (v: FieldValues) =>
      frameRef.current?.contentWindow?.postMessage({ type: "image-kit:fields", values: v }, window.location.origin),
    [],
  );

  useEffect(() => {
    setReady(false);
    const onMessage = (e: MessageEvent<KitMessage>) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === "image-kit:ready") setReady(true);
      if (e.data?.type === "image-kit:applied") applied.current.splice(0).forEach((done) => done());
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [project.id]);

  useEffect(() => {
    if (ready) send(values);
  }, [ready, values, send]);

  useImperativeHandle(
    ref,
    () => ({
      exportJpg: async () => {
        const doc = frameRef.current?.contentDocument;
        const canvas = doc?.getElementById("canvas");
        if (!doc || !canvas || !ready) throw new Error("The image hasn't loaded yet.");
        // Re-send the values and wait until the page has applied them (fonts, images, onFields).
        await new Promise<void>((done) => {
          applied.current.push(done);
          send(values);
        });
        // modern-screenshot resolves url()s in a <style> block against the hub's address, not the page's, so a
        // page's own @font-face (assets/fonts/…) fetched the hub's HTML and fell back to a system font. Make them
        // absolute first; once they are, this is a no-op.
        let rewrote = false;
        for (const style of doc.querySelectorAll("style")) {
          const css = style.textContent ?? "";
          const absolute = css.replace(
            /url\((['"]?)(?![a-z]+:|\/\/|#)([^'")]+)\1\)/gi,
            (_, quote: string, path: string) => `url(${quote}${new URL(path, doc.baseURI).href}${quote})`,
          );
          if (absolute !== css) {
            style.textContent = absolute;
            rewrote = true;
          }
        }
        if (rewrote) await doc.fonts.ready;
        // modern-screenshot paints backgroundColor over #canvas's own, so pass the page's colour (light pages
        // like the LinkedIn profile came out dark); the house ground only fills in for a transparent canvas.
        const own = doc.defaultView?.getComputedStyle(canvas).backgroundColor;
        const backgroundColor = own && own !== "transparent" && own !== "rgba(0, 0, 0, 0)" ? own : "#0a0a0f";
        const url = await domToJpeg(canvas, {
          width: project.width,
          height: project.height,
          scale: 2,
          quality: 0.95,
          backgroundColor,
        });
        return (await fetch(url)).blob();
      },
    }),
    [ready, send, values, project.width, project.height],
  );

  return (
    <div ref={areaRef} className="flex-1 min-w-0 min-h-0 flex items-center justify-center p-4 md:p-8 overflow-hidden">
      <div
        className="relative shrink-0 rounded-md overflow-hidden shadow-2xl ring-1 ring-border-subtle bg-black"
        style={{ width: project.width * scale, height: project.height * scale }}
      >
        <iframe
          ref={frameRef}
          key={project.id}
          src={project.path ?? undefined}
          title={project.title}
          tabIndex={-1}
          className="absolute left-0 top-0 border-0 pointer-events-none"
          style={{
            width: project.width,
            height: project.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            opacity: ready ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-text-dim">Loading…</div>
        )}
      </div>
    </div>
  );
});
