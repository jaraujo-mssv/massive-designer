import React from 'react';
import { useImageToDataUrl } from '@/shared/utils/imageDataUrl';
import { DesignBlock, Theme } from '../../types';
import { THEMES } from '../../constants';
import { getLayoutConfig } from '../../constants/templates';
import { DITHER_GEOMETRY } from '../../constants/dither';
import { isImageBlock, isPartnerBlock } from '../../utils/typeGuards';
import { BlockRenderer } from './BlockRenderer';
import { DitherImageBand } from './DitherImageBand';

interface DitherTwitterCanvasProps {
  blocks: DesignBlock[];
  theme: Theme;
}

/**
 * 1200×675 — text panel left, dithered image right, split down the middle.
 *
 * The panel paints the theme's background image unrotated, unlike the light and
 * dark Twitter templates: those rotate a portrait source 90° to cover a
 * landscape canvas, and this panel is 600×675, which the portrait source covers
 * as it is.
 */
export function DitherTwitterCanvas({ blocks, theme }: DitherTwitterCanvasProps) {
  const layout = getLayoutConfig('twitter', theme);
  const { panelWidth, imageWidth, imageHeight } = DITHER_GEOMETRY.twitter;

  const background = useImageToDataUrl(THEMES[theme].twitter.backgroundImage);
  const logo = useImageToDataUrl(THEMES[theme].twitter.logoImage);

  const image = blocks.find(isImageBlock);
  const partner = blocks.find(isPartnerBlock);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row' }}>
      <div
        style={{
          width: panelWidth,
          height: '100%',
          flexShrink: 0,
          position: 'relative',
          padding: layout.padding,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: layout.contentGap,
          backgroundImage: background ? `url(${background})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <BlockRenderer
          blocks={blocks.filter((b) => b.type === 'heading')}
          template="twitter"
          theme={theme}
        />
        <BlockRenderer
          blocks={blocks.filter((b) => b.type === 'paragraph')}
          template="twitter"
          theme={theme}
        />
        {partner && (
          <img
            src={partner.url}
            alt="Partner"
            style={{
              maxHeight: layout.partnerMaxHeight,
              width: 'auto',
              objectFit: 'contain',
              alignSelf: 'flex-start',
            }}
          />
        )}

        <img
          src={logo}
          alt="Logo"
          style={{
            position: 'absolute',
            left: layout.padding,
            bottom: layout.padding,
            height: layout.logoHeight,
            width: 'auto',
          }}
        />
      </div>

      <DitherImageBand
        url={image?.url}
        width={imageWidth}
        height={imageHeight}
        fallbackBackground={background}
      />
    </div>
  );
}
