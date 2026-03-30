import React from 'react';
import { DesignBlock, Theme } from '../../types';
import { THEMES } from '../../constants';
import { getLayoutConfig } from '../../constants/templates';
import { BlockRenderer } from './BlockRenderer';

interface PGSpeakerLinkedInCanvasProps {
  blocks: DesignBlock[];
  theme: Theme;
}

export function PGSpeakerLinkedInCanvas({ blocks, theme }: PGSpeakerLinkedInCanvasProps) {
  const layout = getLayoutConfig('linkedin', 'pc-speaker');
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8" style={{ padding: layout.padding }}>
      <img src={THEMES[theme].linkedin.logoImage} alt="Logo" style={{ width: '100%', height: 'auto' }} />
      <BlockRenderer blocks={blocks.filter(b => b.type === 'image')} template="linkedin" theme="pc-speaker" />
      <BlockRenderer blocks={blocks.filter(b => b.type === 'heading')} template="linkedin" theme="pc-speaker" />
      <BlockRenderer blocks={blocks.filter(b => b.type === 'paragraph')} template="linkedin" theme="pc-speaker" />
      <BlockRenderer blocks={blocks.filter(b => b.type === 'partner')} template="linkedin" theme="pc-speaker" />
    </div>
  );
}