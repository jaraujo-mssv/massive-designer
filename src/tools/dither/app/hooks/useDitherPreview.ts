import { useEffect, useRef, useState } from 'react';
import { createRenderer, type DitherRenderer } from '@/shared/dither/live/renderer';
import type { LivePreset } from '@/shared/dither/types';

/** Same cap the blog component and the bake use, so cell sizes match everywhere. */
const MAX_EDGE = 1400;

interface PreviewBox {
  width: number;
  height: number;
}

/**
 * Drives a live WebGL preview of `preset` on a canvas.
 *
 * This is the animated counterpart of `render-static.ts`: the loop runs so
 * grain, wiggle and drift are visible while tuning. What the Social Media
 * templates bake is frame 0 of exactly this, which is what pausing shows.
 *
 * The canvas arrives through a callback ref rather than a plain one because
 * switching preview targets re-parents it. A `useRef` would hold the detached
 * node and the renderer would keep drawing into nothing.
 */
export function useDitherPreview(
  preset: LivePreset,
  source: HTMLImageElement | null,
  box: PreviewBox,
  playing: boolean,
) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<DitherRenderer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Note `destroy()` deliberately does not lose the context, so a remount can
  // put a fresh renderer on a canvas that already had one.
  useEffect(() => {
    if (!canvas) return;

    try {
      rendererRef.current = createRenderer(canvas, {
        preset,
        onError: (err) => {
          setError(err.message);
          console.error(err);
        },
      });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }

    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  // Crop to the preview box before upload: the renderer stretches its source
  // across the whole target and does no aspect fitting of its own.
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !canvas || !source) return;

    const sourceWidth = source.naturalWidth || source.width;
    const sourceHeight = source.naturalHeight || source.height;
    if (!sourceWidth || !sourceHeight || !box.width || !box.height) return;

    const fit = Math.min(1, MAX_EDGE / Math.max(box.width, box.height));
    const width = Math.max(1, Math.round(box.width * fit));
    const height = Math.max(1, Math.round(box.height * fit));

    const crop = document.createElement('canvas');
    crop.width = width;
    crop.height = height;
    const ctx = crop.getContext('2d');
    if (!ctx) return;

    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);

    canvas.width = width;
    canvas.height = height;
    renderer.setSource(crop);
    if (!playing) renderer.render(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, source, box.width, box.height]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setPreset(preset);
    if (!playing) renderer.render(0);
  }, [canvas, preset, playing]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (playing) {
      renderer.start();
    } else {
      renderer.stop();
      renderer.render(0);
    }
  }, [canvas, playing]);

  return { setCanvas, error };
}
