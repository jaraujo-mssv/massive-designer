import { Platform } from '../../../types';

export interface ArticleEndpoint {
  name: string;        // e.g. "/ai"
  description: string; // e.g. "ChatGPT, Gemini, Perpexity and Copilot"
}

export interface ArticleProps {
  content: ArticleContent;
  platform: Platform;
}

export const DIMENSIONS = {
  linkedin:         { w: 1080, h: 1350 },
  twitter:          { w: 1200, h: 675 },
  'twitter-article': { w: 1244, h: 500 },
} as const;

export interface ArticleContent {
  title: string;       // "Web Render API"
  tagline: string;     // "The data layer for the agentic cloud"
  endpoints: ArticleEndpoint[];
  bgImageUrl: string;
  logoUrl: string;
}

export const DEFAULT_ARTICLE_CONTENT: ArticleContent = {
  title: 'Web Render API',
  tagline: 'The data layer for the agentic cloud',
  endpoints: [
    { name: '/ai',     description: 'ChatGPT, Gemini, Perpexity and Copilot' },
    { name: '/search', description: 'Search, AI Overviews' },
    { name: '/browse', description: 'Render any page. JS, CAPTCHAs, sessions.' },
  ],
  bgImageUrl: '/web-render-api/Gradient 14.jpg',
  logoUrl: '/logo.svg',
};

export const ORANGE_GRADIENT  = 'linear-gradient(135deg, #d74939 0%, #ff9a63 100%)';
export const ORANGE_GRADIENT_2 = 'linear-gradient(135deg, #ff6e63 0%, #ff9a63 100%)';
