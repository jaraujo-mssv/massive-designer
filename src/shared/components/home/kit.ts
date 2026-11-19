/**
 * The brand kit on the home page, as brand/BRAND.md and brand/assets.md give it: the logo files, the
 * colours of both registers, the fonts, the background and the sizes by channel. The colours are one
 * more copy of the tokens (BRAND.md, "Where the tokens live"): change a value there and here together.
 */

export interface KitLogo {
  name: string
  /** What it's for, under the name. */
  use: string
  /** A public file, so the kit works on the live site. */
  src: string
  /** The ground it's shown on. */
  ground: string
  /** The download's file name, without the extension. */
  file: string
  /** The symbol alone: drawn smaller in its card, so it doesn't outweigh the wordmarks. */
  mark?: true
}

export const LOGOS: KitLogo[] = [
  {
    name: 'Logo, dark grounds',
    use: 'White wordmark, gradient mark. The default.',
    src: '/image-projects/_brand/logo-massive.svg',
    ground: '#0a0a0f',
    file: 'massive-logo-dark',
  },
  {
    name: 'Logo, light grounds',
    use: 'Ink wordmark, on white or the soft orange.',
    src: '/image-projects/_brand/logo-massive-positive.svg',
    ground: '#fff7f2',
    file: 'massive-logo-light',
  },
  {
    name: 'Logo, all white',
    use: 'One colour, for photos and one-colour print.',
    src: '/logo-white.svg',
    ground: '#1a1920',
    file: 'massive-logo-white',
  },
  {
    name: 'Mark',
    use: 'The symbol alone, for avatars and small spaces.',
    src: '/image-projects/_brand/icon-massive.svg',
    ground: '#0a0a0f',
    file: 'massive-mark',
    mark: true,
  },
  {
    name: 'Mark, white',
    use: 'The symbol in one colour.',
    src: '/image-projects/_brand/icon-massive-white.svg',
    ground: '#1a1920',
    file: 'massive-mark-white',
    mark: true,
  },
]

/** How wide the PNG downloads are drawn: sharp enough for a slide or a print. */
export const PNG_WIDTH = 2048

export interface KitColour {
  name: string
  hex: string
  use: string
}

export const REGISTERS: { name: string; note: string; colours: KitColour[] }[] = [
  {
    name: 'Dark',
    note: 'The default.',
    colours: [
      { name: 'Ground', hex: '#0a0a0f', use: 'Backgrounds, with the dot grid' },
      { name: 'Surface', hex: '#121117', use: 'Panels' },
      { name: 'Card', hex: '#1a1920', use: 'Cards' },
      { name: 'Cream', hex: '#faf4ec', use: 'Text: 75% secondary, 55% dim' },
      { name: 'Red', hex: '#d74939', use: 'The one accent' },
      { name: 'Red light', hex: '#ff8163', use: 'Highlights and glows' },
    ],
  },
  {
    name: 'Light',
    note: 'Soft orange, or plain white.',
    colours: [
      { name: 'Soft orange', hex: '#fff7f2', use: 'Backgrounds, with the line grid' },
      { name: 'White', hex: '#ffffff', use: 'Cards, or the whole ground' },
      { name: 'Ink', hex: '#171615', use: 'Text' },
      { name: 'Paper red', hex: '#d54635', use: 'The one accent' },
      { name: 'Decoration', hex: '#f3a07a', use: 'Shapes and lines, at 25%' },
    ],
  },
]

/** The logo's own gradient, shown for reference: it isn't a fill or a background. */
export const LOGO_GRADIENT = ['#F69666', '#F16D65'] as const

/** Cream, which new designs leave out. */
export const NOT_THESE = ['#f1ead8', '#f5ece0']

export const RULES = [
  'One accent, red, and never a second hue.',
  'No cream grounds: dark, soft orange or white.',
  'Outfit for everything. JetBrains Mono only for code.',
  'Use the logo files. Never redraw or recolour them.',
  'Every number comes from a source.',
]

export const FONTS = {
  outfit: 'https://fonts.google.com/specimen/Outfit',
  mono: 'https://fonts.google.com/specimen/JetBrains+Mono',
  caveat: '/image-projects/_brand/fonts/Caveat.ttf',
}

export const BACKGROUND = {
  src: '/image-projects/_brand/bg-dark.jpg',
  size: '1920×1080',
  file: 'massive-background-dark.jpg',
}

/** Sizes by channel (BRAND.md), without the pipeline: what someone making it elsewhere needs. */
export const SIZES: { channel: string; size: string }[] = [
  { channel: 'LinkedIn / Instagram feed (portrait)', size: '1080×1350' },
  { channel: 'Square post, carousel page', size: '1080×1080' },
  { channel: 'LinkedIn document carousel', size: '1080×1350 pages, as one PDF' },
  { channel: 'Story, Reel, Short', size: '1080×1920' },
  { channel: 'X post', size: '1200×675' },
  { channel: 'Landscape, YouTube video', size: '1920×1080' },
  { channel: 'Link preview (Open Graph)', size: '1200×630' },
  { channel: 'YouTube thumbnail', size: '1280×720' },
  { channel: 'LinkedIn company cover', size: '1128×191' },
  { channel: 'Print', size: 'A4, A5, A3, letter' },
  { channel: 'Roll-up banner', size: '850×2000 mm (856×2006 with bleed)' },
]
