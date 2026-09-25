import React from 'react';
import { useDitheredImage } from '@/shared/dither/useDitheredImage';
import { getDitherPreset } from '../../constants/dither';

interface DitherImageBandProps {
  url?: string;
  width: number;
  height: number;
  /** Painted behind the image, so an absent or still-baking source is not a white hole. */
  fallbackBackground?: string;
}

/**
 * The full-bleed dithered image the dither templates are built around.
 *
 * The bake is what makes this exportable: `modern-screenshot` snapshots the
 * DOM, so what has to be on the canvas at export time is a plain `<img>` with a
 * data URL, not a live WebGL surface. See `shared/dither/render-static.ts`.
 */
export function DitherImageBand({ url, width, height, fallbackBackground }: DitherImageBandProps) {
  const { src } = useDitheredImage(url, getDitherPreset(), { width, height });

  return (
    <div
      style={{
        width,
        height,
        flexShrink: 0,
        overflow: 'hidden',
        backgroundImage: fallbackBackground ? `url(${fallbackBackground})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {src && (
        <img
          src={src}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            // The bake is capped at 1400px on its longest edge, so it is scaled
            // up to fill the band. Smoothing it here would undo the dither.
            imageRendering: 'pixelated',
          }}
        />
      )}
    </div>
  );
}
