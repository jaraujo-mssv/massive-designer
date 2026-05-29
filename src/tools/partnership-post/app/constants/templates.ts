export type CanvasMode = 'dark' | 'light';
export type TemplateId = 'laptop-dark' | 'laptop-light' | 'map-dark' | 'map-light';

export interface TemplateConfig {
  id: TemplateId;
  label: string;
  mode: CanvasMode;
  background: string;
  scale: number;
  framed: boolean; // wrap the lockup in a Mac-style browser window
}

export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  'laptop-dark': { id: 'laptop-dark', label: 'Laptop Dark', mode: 'dark', background: '/partner-dark.jpg', scale: 0.65, framed: false },
  'laptop-light': { id: 'laptop-light', label: 'Laptop Light', mode: 'light', background: '/partner-light.jpg', scale: 0.65, framed: false },
  'map-dark': { id: 'map-dark', label: 'Map Dark', mode: 'dark', background: '/bg.jpg', scale: 1, framed: true },
  'map-light': { id: 'map-light', label: 'Map Light', mode: 'light', background: '/bg-light.jpg', scale: 1, framed: true },
};

export const DEFAULT_TEMPLATE: TemplateId = 'laptop-dark';

export const resolveTemplate = (p: URLSearchParams): TemplateId => {
  const t = p.get('template');
  if (t && t in TEMPLATES) return t as TemplateId;
  if (p.get('mode') === 'light') return 'laptop-light'; // backward-compat
  return DEFAULT_TEMPLATE;
};
