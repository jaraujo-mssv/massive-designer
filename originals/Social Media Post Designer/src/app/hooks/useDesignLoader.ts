import { ImportedDesign, DesignBlock, Theme } from '../types';
import { THEMES } from '../constants';
import {
  createImageBlock,
  createHeadingBlock,
  createParagraphBlock,
  createPartnerBlock,
  normalizeTheme,
  parseHeadingLevel,
} from '../utils/blocks';

export function useDesignLoader(
  setProjectTheme: (theme: Theme) => void,
  setDesignTitle: (title: string) => void,
  setBlocks: (blocks: DesignBlock[]) => void,
  setLoadedDesignIndex: (index: number) => void
) {
  const loadDesign = (design: ImportedDesign, index: number) => {
    // Set the design title for export
    setDesignTitle(design.title || 'design');

    // Parse and apply theme
    const theme = normalizeTheme(design.theme);
    setProjectTheme(theme);

    // Create blocks after a delay
    setTimeout(() => {
      const newBlocks: DesignBlock[] = [];

      if (design.image) {
        newBlocks.push(createImageBlock(design.image, 1080));
      }

      if (design.heading) {
        const level = parseHeadingLevel(design.header);
        newBlocks.push(createHeadingBlock(design.heading, level, theme));
      }

      if (design.body) {
        newBlocks.push(createParagraphBlock(design.body, theme));
      }

      if (design.partner) {
        newBlocks.push(createPartnerBlock(design.partner));
      }

      setBlocks(newBlocks);
      setLoadedDesignIndex(index);
    }, 100);
  };

  return { loadDesign };
}