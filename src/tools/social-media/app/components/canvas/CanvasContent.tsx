import React from 'react';
import { DesignBlock, Theme, Template } from '../../types';
import { PGSpeakerTwitterCanvas } from './PGSpeakerTwitterCanvas';
import { PGSpeakerLinkedInCanvas } from './PGSpeakerLinkedInCanvas';
import { TwitterCanvas } from './TwitterCanvas';
import { LinkedInCanvas } from './LinkedInCanvas';
import { DitherTwitterCanvas } from './DitherTwitterCanvas';
import { DitherLinkedInCanvas } from './DitherLinkedInCanvas';
import { isDitherTheme } from '../../constants/dither';

interface CanvasContentProps {
  blocks: DesignBlock[];
  theme: Theme;
  template: Template;
}

export function CanvasContent({ blocks, theme, template }: CanvasContentProps) {
  if (isDitherTheme(theme)) {
    return template === 'twitter'
      ? <DitherTwitterCanvas blocks={blocks} theme={theme} />
      : <DitherLinkedInCanvas blocks={blocks} theme={theme} />;
  }

  if (theme === 'pc-speaker') {
    return template === 'twitter' 
      ? <PGSpeakerTwitterCanvas blocks={blocks} theme={theme} />
      : <PGSpeakerLinkedInCanvas blocks={blocks} theme={theme} />;
  }

  return template === 'twitter'
    ? <TwitterCanvas blocks={blocks} theme={theme} />
    : <LinkedInCanvas blocks={blocks} theme={theme} />;
}