import { RefObject, useEffect, useState } from 'react';

/**
 * Scale that fits a `width` × `height` design inside the element `ref` points
 * at, with a 5% margin. Re-measured whenever the element resizes.
 * Before the first measure it's `fallback`.
 */
export function useFitScale(ref: RefObject<HTMLElement | null>, width: number, height: number, fallback = 0.5): number {
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      setBox({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return box.w > 0 && box.h > 0 ? Math.min(box.w / width, box.h / height) * 0.95 : fallback;
}
