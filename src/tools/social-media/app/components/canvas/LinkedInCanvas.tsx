import React from 'react';
import { DesignBlock, Theme } from '../../types';
import { THEMES } from '../../constants';
import { getLayoutConfig } from '../../constants/templates';
import { BlockRenderer } from './BlockRenderer';

interface LinkedInCanvasProps {
  blocks: DesignBlock[];
  theme: Theme;
}

export function LinkedInCanvas({ blocks, theme }: LinkedInCanvasProps) {
  const layout = getLayoutConfig('linkedin', theme);
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8 p-24">
      <BlockRenderer blocks={blocks.filter(b => b.type === 'heading')} template="linkedin" theme={theme} />
      <BlockRenderer blocks={blocks.filter(b => b.type === 'paragraph')} template="linkedin" theme={theme} />
      <BlockRenderer blocks={blocks.filter(b => b.type === 'image')} template="linkedin" theme={theme} />
      <img src={THEMES[theme].linkedin.logoImage} alt="Logo" style={{ width: 'auto', height: layout.logoHeight }} />
    </div>
  );
}