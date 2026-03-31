import { Template, Theme } from '../types';

// ==========================================
// TEMPLATE DIMENSIONS
// ==========================================
export const TEMPLATE_DIMENSIONS: Record<Template, { width: number; height: number }> = {
  linkedin: { width: 1080, height: 1350 },
  twitter: { width: 1200, height: 675 },
};

// ==========================================
// TYPE DEFINITIONS
// ==========================================
export interface LayoutConfig {
  padding: string;
  gap?: string;
  leftImageWidth?: string;
  rightColumnMaxWidth?: string;
  logoWidth?: string;
  logoHeight?: string;
  partnerMaxHeight?: string;
  contentGap?: string;
}

export interface TextStyles {
  heading: {
    lineHeight: string;
    fontFamily: string;
    fontWeight: number;
    fontStyle?: string;
    textAlign: 'left' | 'center' | 'right';
  };
  paragraph: {
    fontSize: string;
    lineHeight: string;
    fontFamily: string;
    fontWeight: number;
    textAlign: 'left' | 'center' | 'right';
  };
}

export interface ImageStyles {
  border?: string;
  borderRadius?: string;
}

export interface ThemeConfig {
  layout: LayoutConfig;
  textStyles: TextStyles;
  imageStyles?: ImageStyles;
}

// ==========================================
// TWITTER TEMPLATE CONFIGURATION
// ==========================================
export const TWITTER_TEMPLATE_CONFIG: Record<Theme, ThemeConfig> = {
  'pc-speaker': {
    layout: {
      padding: '58px',
      gap: '48px',
      leftImageWidth: '560px',
      rightColumnMaxWidth: '450px',
      logoWidth: '450px',
      partnerMaxHeight: '100px',
      contentGap: '1.5rem',
    },
    textStyles: {
      heading: {
        lineHeight: '0.95',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        textAlign: 'left',
      },
      paragraph: {
        fontSize: '28px',
        lineHeight: '1.2',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        textAlign: 'left',
      },
    },
    imageStyles: {
      border: '2px solid transparent',
      borderRadius: '0px',
    },
  },
  light: {
    layout: {
      padding: '58px',
      gap: '48px',
      leftImageWidth: '450px',
      rightColumnMaxWidth: '560px',
      logoHeight: '64px',
      partnerMaxHeight: '100px',
      contentGap: '1.5rem',
    },
    textStyles: {
      heading: {
        lineHeight: '1.1',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 900,
        fontStyle: 'italic',
        textAlign: 'left',
      },
      paragraph: {
        fontSize: '28px',
        lineHeight: '1.2',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        textAlign: 'left',
      },
    },
  },
  dark: {
    layout: {
      padding: '58px',
      gap: '48px',
      leftImageWidth: '450px',
      rightColumnMaxWidth: '560px',
      logoHeight: '64px',
      partnerMaxHeight: '100px',
      contentGap: '1.5rem',
    },
    textStyles: {
      heading: {
        lineHeight: '1.1',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 900,
        fontStyle: 'italic',
        textAlign: 'left',
      },
      paragraph: {
        fontSize: '28px',
        lineHeight: '1.2',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        textAlign: 'left',
      },
    },
  },
};

// ==========================================
// LINKEDIN TEMPLATE CONFIGURATION
// ==========================================
export const LINKEDIN_TEMPLATE_CONFIG: Record<Theme, ThemeConfig> = {
  'pc-speaker': {
    layout: {
      padding: '90px',
      contentGap: '2rem',
      logoHeight: '64px',
    },
    textStyles: {
      heading: {
        lineHeight: '0.95',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        textAlign: 'center',
      },
      paragraph: {
        fontSize: '32px',
        lineHeight: '1.2',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        textAlign: 'center',
      },
    },
    imageStyles: {
      border: '2px solid transparent',
      borderRadius: '0px',
    },
  },
  light: {
    layout: {
      padding: '6rem',
      contentGap: '2rem',
      logoHeight: '64px',
    },
    textStyles: {
      heading: {
        lineHeight: '1.1',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 900,
        fontStyle: 'italic',
        textAlign: 'center',
      },
      paragraph: {
        fontSize: '32px',
        lineHeight: '1.2',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        textAlign: 'center',
      },
    },
  },
  dark: {
    layout: {
      padding: '6rem',
      contentGap: '2rem',
      logoHeight: '64px',
    },
    textStyles: {
      heading: {
        lineHeight: '1.1',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 900,
        fontStyle: 'italic',
        textAlign: 'center',
      },
      paragraph: {
        fontSize: '32px',
        lineHeight: '1.2',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        textAlign: 'center',
      },
    },
  },
};

// ==========================================
// UNIFIED TEMPLATE CONFIGURATION
// ==========================================
export const TEMPLATE_CONFIG = {
  twitter: TWITTER_TEMPLATE_CONFIG,
  linkedin: LINKEDIN_TEMPLATE_CONFIG,
} as const;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get configuration for a specific template and theme combination
 */
export function getTemplateConfig(template: Template, theme: Theme): ThemeConfig {
  return TEMPLATE_CONFIG[template][theme];
}

/**
 * Get layout configuration for a specific template and theme
 */
export function getLayoutConfig(template: Template, theme: Theme): LayoutConfig {
  return TEMPLATE_CONFIG[template][theme].layout;
}

/**
 * Get text styles for a specific template and theme
 */
export function getTextStyles(template: Template, theme: Theme): TextStyles {
  return TEMPLATE_CONFIG[template][theme].textStyles;
}

/**
 * Get image styles for a specific template and theme
 */
export function getImageStyles(template: Template, theme: Theme): ImageStyles | undefined {
  return TEMPLATE_CONFIG[template][theme].imageStyles;
}

// ==========================================
// TWITTER-SPECIFIC CONSTANTS (for backward compatibility)
// ==========================================
export const TWITTER_HEADING_SIZES: Record<1 | 2 | 3, number> = {
  1: 80,
  2: 64,
  3: 48,
};