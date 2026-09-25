import React from 'react';
import { useImageToDataUrl } from '@/shared/utils/imageDataUrl';
import { DesignBlock, Theme } from '../../types';
import { THEMES } from '../../constants';
import { getLayoutConfig } from '../../constants/templates';
import { DITHER_GEOMETRY } from '../../constants/dither';
import { isImageBlock, isPartnerBlock } from '../../utils/typeGuards';
import { BlockRenderer } from './BlockRenderer';
import { DitherImageBand } from './DitherImageBand';

interface DitherLinkedInCanvasProps {
  blocks: DesignBlock[];
  theme: Theme;
}

/**
 * 1080×1350 — dithered image band across the top, text panel below.
 *
 * Unlike the light/dark LinkedIn template, the background image belongs to the
 * panel rather than the whole canvas (the top 700px is photograph), and the
 * text is left-aligned. Everything else — fonts, colours, logo — is the light
 * or dark theme unchanged.
 */
export function DitherLinkedInCanvas({ blocks, theme }: DitherLinkedInCanvasProps) {
  const layout = getLayoutConfig('linkedin', theme);
  const { imageWidth, imageHeight } = DITHER_GEOMETRY.linkedin;

  // Through the proxy so the export cannot be caught waiting on a remote fetch.
  const background = useImageToDataUrl(THEMES[theme].linkedin.backgroundImage);
  const logo = useImageToDataUrl(THEMES[theme].linkedin.logoImage);

  const image = blocks.find(isImageBlock);
  const partner = blocks.find(isPartnerBlock);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DitherImageBand
        url={image?.url}
        width={imageWidth}
        height={imageHeight}
        fallbackBackground={background}
      />

      <div
        style={{
          flex: 1,
          position: 'relative',
          padding: layout.padding,
          display: 'flex',
          flexDirection: 'column',
          gap: layout.contentGap,
          backgroundImage: background ? `url(${background})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <BlockRenderer
          blocks={blocks.filter((b) => b.type === 'heading')}
          template="linkedin"
          theme={theme}
        />
        <BlockRenderer
          blocks={blocks.filter((b) => b.type === 'paragraph')}
          template="linkedin"
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
            right: layout.padding,
            bottom: layout.padding,
            height: layout.logoHeight,
            width: 'auto',
          }}
        />
      </div>
    </div>
  );
}
