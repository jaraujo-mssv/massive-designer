import { ThemesConfig, HeadingLevel } from '../types';

export const THEMES: ThemesConfig = {
  light: {
    headingColor: '#223547',
    paragraphColor: '#6A788F',
    linkedin: {
      backgroundImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/light.jpg',
      logoImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-light.png',
    },
    twitter: {
      backgroundImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/light.jpg',
      logoImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-light.png',
    },
  },
  dark: {
    headingColor: '#FFFFFF',
    paragraphColor: '#FFBD71',
    linkedin: {
      backgroundImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/dark.jpg',
      logoImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-dark.png',
    },
    twitter: {
      backgroundImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/dark.jpg',
      logoImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-dark.png',
    },
  },
  'pc-speaker': {
    headingColor: '#FFFFFF',
    paragraphColor: '#FFFFFF',
    linkedin: {
      backgroundImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/refs/heads/main/pg-linkedin.jpg',
      logoImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/refs/heads/main/pg-logo-linkedin.png',
    },
    twitter: {
      backgroundImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/refs/heads/main/pg-xtwitter.jpg',
      logoImage: 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/refs/heads/main/pg-logo-xtwitter.png',
    },
  },
};

export const HEADING_SIZES: Record<HeadingLevel, number> = {
  h1: 100,
  h2: 80,
  h3: 64,
  h4: 48,
  h5: 36,
  h6: 28,
};

export const TWITTER_HEADING_SIZES: Record<HeadingLevel, number> = {
  h1: 76,
  h2: 60,
  h3: 48,
  h4: 36,
  h5: 28,
  h6: 22,
};