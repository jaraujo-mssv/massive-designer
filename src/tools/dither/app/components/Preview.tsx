import React from 'react';
import { useImageToDataUrl } from '@/shared/utils/imageDataUrl';
import { THEMES } from '@/tools/social-media/app/constants';
import { getLayoutConfig } from '@/tools/social-media/app/constants/templates';
import { DITHER_GEOMETRY } from '@/tools/social-media/app/constants/dither';
import { TWITTER_HEADING_SIZES, HEADING_SIZES } from '@/tools/social-media/app/constants/themes';
import type { Theme } from '@/tools/social-media/app/types';
import { useDitherPreview } from '../hooks/useDitherPreview';
import type { LivePreset } from '@/shared/dither/types';

export type PreviewTarget = 'free' | 'linkedin' | 'twitter';

interface PreviewProps {
  preset: LivePreset;
  source: HTMLImageElement | null;
  target: PreviewTarget;
  theme: Extract<Theme, 'dither-light' | 'dither-dark'>;
  playing: boolean;
  headingText: string;
  bodyText: string;
}

/** Frame size and where the dithered image sits inside it, per target. */
const FRAMES: Record<PreviewTarget, { width: number; height: number; scale: number }> = {
  free: { width: 960, height: 600, scale: 0.75 },
  linkedin: { width: 1080, height: 1350, scale: 0.4 },
  twitter: { width: 1200, height: 675, scale: 0.55 },
};

function imageBox(target: PreviewTarget) {
  if (target === 'linkedin') return DITHER_GEOMETRY.linkedin;
  if (target === 'twitter') {
    return { imageWidth: DITHER_GEOMETRY.twitter.imageWidth, imageHeight: DITHER_GEOMETRY.twitter.imageHeight };
  }
  return { imageWidth: FRAMES.free.width, imageHeight: FRAMES.free.height };
}

/**
 * The live preview.
 *
 * `free` is the plain stage for judging the treatment on its own; the other two
 * put the same canvas inside a real `dither-light` / `dither-dark` frame at
 * export dimensions, which is the only way to see whether the cells read at the
 * size the post actually ships at. Since the Social Media tool takes its theme
 * from the spreadsheet, this is also where the layout gets checked.
 */
export function Preview({
  preset,
  source,
  target,
  theme,
  playing,
  headingText,
  bodyText,
}: PreviewProps) {
  const frame = FRAMES[target];
  const { imageWidth, imageHeight } = imageBox(target);
  const { setCanvas, error } = useDitherPreview(preset, source, {
    width: imageWidth,
    height: imageHeight,
  }, playing);

  const isLinkedin = target === 'linkedin';
  const platform = isLinkedin ? 'linkedin' : 'twitter';
  const layout = getLayoutConfig(platform, theme);
  const background = useImageToDataUrl(THEMES[theme][platform].backgroundImage);
  const logo = useImageToDataUrl(THEMES[theme][platform].logoImage);

  // The panel is always rendered — it is the canvas's stable sibling, and a
  // conditional one would re-key the canvas on every target switch.
  const panelStyle: React.CSSProperties =
    target === 'free'
      ? { display: 'none' }
      : {
          position: 'absolute',
          ...(isLinkedin
            ? { left: 0, right: 0, top: DITHER_GEOMETRY.linkedin.imageHeight, bottom: 0 }
            : { left: 0, top: 0, bottom: 0, width: DITHER_GEOMETRY.twitter.panelWidth }),
          padding: layout.padding,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isLinkedin ? 'flex-start' : 'center',
          gap: layout.contentGap,
          backgroundImage: background ? `url(${background})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };

  const canvasSlotStyle: React.CSSProperties =
    target === 'free'
      ? { position: 'absolute', inset: 0 }
      : isLinkedin
        ? { position: 'absolute', left: 0, top: 0, width: imageWidth, height: imageHeight }
        : { position: 'absolute', right: 0, top: 0, width: imageWidth, height: imageHeight };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        style={{ width: frame.width * frame.scale, height: frame.height * frame.scale }}
        className="shadow-2xl"
      >
        <div
          style={{
            position: 'relative',
            width: frame.width,
            height: frame.height,
            overflow: 'hidden',
            background: '#000',
            transform: `scale(${frame.scale})`,
            transformOrigin: 'top left',
          }}
        >
          <div style={panelStyle}>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                lineHeight: 1.1,
                textAlign: 'left',
                color: THEMES[theme].headingColor,
                fontSize: isLinkedin ? HEADING_SIZES.h1 : TWITTER_HEADING_SIZES.h1,
              }}
            >
              {headingText}
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 400,
                lineHeight: 1.2,
                textAlign: 'left',
                color: THEMES[theme].paragraphColor,
                fontSize: isLinkedin ? 32 : 28,
              }}
            >
              {bodyText}
            </div>
            <img
              src={logo}
              alt="Logo"
              style={{
                position: 'absolute',
                ...(isLinkedin ? { right: layout.padding } : { left: layout.padding }),
                bottom: layout.padding,
                height: layout.logoHeight,
                width: 'auto',
              }}
            />
          </div>

          <div style={canvasSlotStyle}>
            <canvas
              ref={setCanvas}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                imageRendering: 'pixelated',
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-brand-light">
          GPU error — the Social Media templates will fall back to the plain photo. {error}
        </p>
      )}
    </div>
  );
}
