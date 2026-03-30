import React from 'react';
import { DesignBlock, Theme } from '../../types';
import { THEMES } from '../../constants';
import { getLayoutConfig } from '../../constants/templates';
import { BlockRenderer } from './BlockRenderer';

interface TwitterCanvasProps {
  blocks: DesignBlock[];
  theme: Theme;
}

export function TwitterCanvas({ blocks, theme }: TwitterCanvasProps) {
  const layout = getLayoutConfig('twitter', theme);
  
  return (
    <div className="w-full h-full flex" style={{ padding: layout.padding, gap: layout.gap }}>
      <div style={{ maxWidth: layout.leftImageWidth }} className="flex items-center justify-start">
        <BlockRenderer blocks={blocks.filter(b => b.type === 'image')} template="twitter" theme={theme} />
      </div>
      <div style={{ maxWidth: layout.rightColumnMaxWidth }} className="flex flex-col justify-center items-center gap-6">
        <BlockRenderer blocks={blocks.filter(b => b.type === 'heading')} template="twitter" theme={theme} />
        <BlockRenderer blocks={blocks.filter(b => b.type === 'paragraph')} template="twitter" theme={theme} />
        <img src={THEMES[theme].twitter.logoImage} alt="Logo" style={{ height: layout.logoHeight, width: 'auto' }} />
        <BlockRenderer blocks={blocks.filter(b => b.type === 'partner')} template="twitter" theme={theme} />
      </div>
    </div>
  );
}