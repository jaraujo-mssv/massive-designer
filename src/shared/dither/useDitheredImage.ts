import { useEffect, useState } from 'react';
import { renderDitheredDataUrl, type DitherBox } from './render-static';
import type { LivePreset } from './types';

/**
 * Bakes `url` through `preset` and returns the resulting data URL.
 *
 * `src` stays empty until the bake lands rather than falling back to the raw
 * photograph, so a template never flashes the undithered image on its way to
 * the dithered one — which would otherwise be exactly what an export fired too
 * early captures.
 */
export function useDitheredImage(
  url: string | undefined,
  preset: LivePreset,
  box: DitherBox,
): { src: string; ready: boolean } {
  const [src, setSrc] = useState('');

  // Presets are plain data pasted in from the tuner, so identity is not stable
  // across renders; the serialised form is what actually decides the pixels.
  const presetKey = JSON.stringify(preset);

  useEffect(() => {
    if (!url) {
      setSrc('');
      return;
    }

    let cancelled = false;
    setSrc('');
    renderDitheredDataUrl(url, preset, box).then((result) => {
      if (!cancelled) setSrc(result);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, presetKey, box.width, box.height]);

  return { src, ready: Boolean(src) };
}
