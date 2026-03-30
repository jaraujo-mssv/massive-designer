# Template & Theme Architecture

## Overview

This project is structured to support multiple **social media templates** (LinkedIn, X/Twitter, etc.) combined with multiple **themes** (pc-speaker, light, dark, etc.).

### Current Combinations (6 variations)

| Template | Theme | Description | Layout Notes |
|----------|-------|-------------|--------------|
| LinkedIn | pc-speaker | PC-Speaker branded LinkedIn posts | Logo at top, centered layout |
| LinkedIn | light | Light theme LinkedIn posts | Logo at bottom, centered layout |
| LinkedIn | dark | Dark theme LinkedIn posts | Logo at bottom, centered layout |
| Twitter | pc-speaker | PC-Speaker branded X/Twitter posts | 560px image (left), 450px content (right), logo at top |
| Twitter | light | Light theme X/Twitter posts | 450px image (left), 560px content (right), logo at bottom |
| Twitter | dark | Dark theme X/Twitter posts | 450px image (left), 560px content (right), logo at bottom |

## Architecture

### 1. **Template-First Organization**

All configurations are organized by template first, then by theme within each template:

```typescript
TEMPLATE_CONFIG = {
  twitter: {
    'pc-speaker': { layout, textStyles, imageStyles },
    'light': { layout, textStyles, imageStyles },
    'dark': { layout, textStyles, imageStyles }
  },
  linkedin: {
    'pc-speaker': { layout, textStyles, imageStyles },
    'light': { layout, textStyles, imageStyles },
    'dark': { layout, textStyles, imageStyles }
  }
}
```

### 2. **Configuration Structure**

Each template×theme combination includes:

- **Layout Configuration**: Padding, gaps, dimensions, positioning
- **Text Styles**: Typography settings for headings and paragraphs
- **Image Styles**: Border, border radius, gradient effects (optional)

### 3. **Component Structure**

Components receive `template` and `theme` separately:

```tsx
<BlockRenderer 
  blocks={blocks} 
  template="twitter" 
  theme="pc-speaker" 
/>
```

## Adding New Templates

To add a new social media platform (e.g., Instagram):

### 1. Update Type Definition

In `/src/app/types/index.ts`:

```typescript
export type Template = 'linkedin' | 'twitter' | 'instagram';
```

### 2. Add Template Dimensions

In `/src/app/constants/templates.ts`:

```typescript
export const TEMPLATE_DIMENSIONS: Record<Template, { width: number; height: number }> = {
  linkedin: { width: 1080, height: 1350 },
  twitter: { width: 1200, height: 675 },
  instagram: { width: 1080, height: 1080 }, // Add new
};
```

### 3. Create Template Configuration

```typescript
export const INSTAGRAM_TEMPLATE_CONFIG: Record<Theme, ThemeConfig> = {
  'pc-speaker': {
    layout: { /* ... */ },
    textStyles: { /* ... */ },
    imageStyles: { /* ... */ }
  },
  light: {
    layout: { /* ... */ },
    textStyles: { /* ... */ }
  },
  dark: {
    layout: { /* ... */ },
    textStyles: { /* ... */ }
  }
};
```

### 4. Add to Unified Config

```typescript
export const TEMPLATE_CONFIG = {
  twitter: TWITTER_TEMPLATE_CONFIG,
  linkedin: LINKEDIN_TEMPLATE_CONFIG,
  instagram: INSTAGRAM_TEMPLATE_CONFIG, // Add new
} as const;
```

### 5. Create Canvas Component

Create `/src/app/components/canvas/InstagramCanvas.tsx`:

```tsx
export function InstagramCanvas({ blocks, theme }: InstagramCanvasProps) {
  const layout = getLayoutConfig('instagram', theme);
  
  return (
    <div>
      <BlockRenderer blocks={blocks} template="instagram" theme={theme} />
    </div>
  );
}
```

### 6. Update Canvas Selector

In `/src/app/components/canvas/CanvasArea.tsx`, add the new canvas component.

## Adding New Themes

To add a new theme (e.g., high-contrast):

### 1. Update Type Definition

In `/src/app/types/index.ts`:

```typescript
export type Theme = 'light' | 'dark' | 'pc-speaker' | 'high-contrast';
```

### 2. Add Theme to Each Template

In each template configuration, add the new theme:

```typescript
export const TWITTER_TEMPLATE_CONFIG: Record<Theme, ThemeConfig> = {
  'pc-speaker': { /* ... */ },
  light: { /* ... */ },
  dark: { /* ... */ },
  'high-contrast': {
    layout: { /* ... */ },
    textStyles: { /* ... */ },
    imageStyles: { /* ... */ }
  }
};

// Repeat for LINKEDIN_TEMPLATE_CONFIG and any other templates
```

### 3. Update Theme Constants

In `/src/app/constants/themes.ts`, add theme configuration:

```typescript
export const THEMES: Record<Theme, ThemeData> = {
  // ... existing themes
  'high-contrast': {
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    twitter: {
      backgroundImage: 'url(...)',
      logoImage: 'url(...)'
    },
    linkedin: {
      backgroundImage: 'url(...)',
      logoImage: 'url(...)'
    }
  }
};
```

## Key Files

- `/src/app/constants/templates.ts` - All template×theme configurations
- `/src/app/constants/themes.ts` - Theme visual assets (backgrounds, logos)
- `/src/app/components/canvas/BlockRenderer.tsx` - Renders blocks based on template×theme
- `/src/app/components/canvas/*Canvas.tsx` - Template-specific canvas components
- `/src/app/types/index.ts` - Type definitions for Template and Theme

## Helper Functions

Use these to access configurations:

```typescript
import { getTemplateConfig, getLayoutConfig, getTextStyles, getImageStyles } from '@/constants/templates';

const config = getTemplateConfig('twitter', 'pc-speaker');
const layout = getLayoutConfig('twitter', 'pc-speaker');
const textStyles = getTextStyles('twitter', 'pc-speaker');
const imageStyles = getImageStyles('twitter', 'pc-speaker');
```

## Special Features

### PC-Speaker Gradient Border

Images in the `pc-speaker` theme automatically receive a 2px gradient border (45deg, #1E61F0 → #F8BEDB). This is handled in `BlockRenderer.tsx` by wrapping images in a gradient container.

### Twitter Heading Sizes

Twitter template uses specific heading sizes based on level:
- H1: 80px
- H2: 64px  
- H3: 48px

These are defined in `TWITTER_HEADING_SIZES` constant.