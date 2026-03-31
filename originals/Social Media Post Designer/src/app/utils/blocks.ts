import {
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  PartnerBlock,
  HeadingLevel,
  Theme,
} from '../types';
import { THEMES, HEADING_SIZES } from '../constants';

export const createImageBlock = (url: string, width: number): ImageBlock => ({
  id: Date.now().toString() + '-image',
  type: 'image',
  url,
  width: width - 64,
  height: 0,
});

export const createHeadingBlock = (
  text: string,
  level: HeadingLevel,
  theme: Theme
): HeadingBlock => ({
  id: Date.now().toString() + '-heading',
  type: 'heading',
  text,
  level,
  fontSize: HEADING_SIZES[level],
  color: THEMES[theme].headingColor,
});

export const createParagraphBlock = (text: string, theme: Theme): ParagraphBlock => ({
  id: Date.now().toString() + '-paragraph',
  type: 'paragraph',
  text,
  color: THEMES[theme].paragraphColor,
});

export const createPartnerBlock = (url: string): PartnerBlock => ({
  id: Date.now().toString() + '-partner',
  type: 'partner',
  url,
});

export const normalizeTheme = (themeStr: string): Theme => {
  const normalized = themeStr.toLowerCase().trim();
  if (normalized === 'dark') return 'dark';
  if (normalized === 'pc-speaker') return 'pc-speaker';
  return 'light';
};

export const parseHeadingLevel = (headerStr: string): HeadingLevel => {
  const normalized = headerStr?.toLowerCase().trim() as HeadingLevel;
  return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(normalized) ? normalized : 'h1';
};