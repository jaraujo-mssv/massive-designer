import React from 'react';
import { DesignBlock, Theme } from '../../types';
import { THEMES } from '../../constants';
import { getLayoutConfig } from '../../constants/templates';
import { BlockRenderer } from './BlockRenderer';

interface PGSpeakerTwitterCanvasProps {
  blocks: DesignBlock[];
  theme: Theme;
}

export function PGSpeakerTwitterCanvas({ blocks, theme }: PGSpeakerTwitterCanvasProps) {
  const layout = getLayoutConfig('twitter', 'pc-speaker');
  
  return (
    <div className="w-full h-full flex" style={{ padding: layout.padding, gap: layout.gap }}>
      <div style={{ width: layout.leftImageWidth }} className="flex items-center justify-start">
        <BlockRenderer blocks={blocks.filter(b => b.type === 'image')} template="twitter" theme="pc-speaker" />
      </div>
      <div style={{ maxWidth: layout.rightColumnMaxWidth }} className="flex flex-col justify-center gap-6">
        <div className="flex items-center justify-start">
          <img src={THEMES[theme].twitter.logoImage} alt="Logo" style={{ width: layout.logoWidth, height: 'auto' }} />
        </div>
        <BlockRenderer blocks={blocks.filter(b => b.type === 'heading')} template="twitter" theme="pc-speaker" />
        <BlockRenderer blocks={blocks.filter(b => b.type === 'paragraph')} template="twitter" theme="pc-speaker" />
        <BlockRenderer blocks={blocks.filter(b => b.type === 'partner')} template="twitter" theme="pc-speaker" />
      </div>
    </div>
  );
}