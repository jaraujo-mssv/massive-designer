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
  fontSize: HEADING_SIZES[level.split('-')[0]],
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
  // The theme column is typed by hand into a spreadsheet, so spaces and
  // underscores are treated as hyphens rather than silently falling back to light.
  const normalized = themeStr.toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (normalized === 'dark') return 'dark';
  if (normalized === 'pc-speaker') return 'pc-speaker';
  if (normalized === 'dither-light') return 'dither-light';
  if (normalized === 'dither-dark') return 'dither-dark';
  return 'light';
};

export const parseHeadingLevel = (headerStr: string): HeadingLevel => {
  const normalized = headerStr?.toLowerCase().trim();
  const [base, weight] = normalized.split('-');
  const validBase = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(base) ? base : 'h1';
  if (weight) {
    const parsedWeight = parseInt(weight);
    if ([100, 200, 300, 400, 500, 600, 700, 800, 900].includes(parsedWeight)) {
      return `${validBase}-${parsedWeight}` as HeadingLevel;
    }
  }
  return validBase as HeadingLevel;
};