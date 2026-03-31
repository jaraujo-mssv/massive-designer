// Core types for the Social Media Post Designer

export type TabType = 'blocks' | 'import';
export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type ExportFormat = 'png' | 'jpg';
export type Theme = 'light' | 'dark' | 'pc-speaker';
export type Template = 'linkedin' | 'twitter';

export interface ProjectSettings {
  theme: Theme;
  width: number;
  height: number;
  backgroundImage: string;
}

export interface HeadingBlock {
  id: string;
  type: 'heading';
  text: string;
  level: HeadingLevel;
  fontSize: number;
  color: string;
}

export interface ParagraphBlock {
  id: string;
  type: 'paragraph';
  text: string;
  color: string;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  url: string;
  width: number;
  height: number;
}

export interface PartnerBlock {
  id: string;
  type: 'partner';
  url: string;
}

export type DesignBlock = HeadingBlock | ParagraphBlock | ImageBlock | PartnerBlock;

export interface ImportedDesign {
  title: string;
  theme: string;
  size: string;
  heading: string;
  header: string;
  body: string;
  image: string;
  partner: string;
}

export interface SavedSpreadsheet {
  id: string;
  name: string;
  url: string;
  isSample?: boolean;
}

export interface ThemeConfig {
  headingColor: string;
  paragraphColor: string;
  linkedin: {
    backgroundImage: string;
    logoImage: string;
  };
  twitter: {
    backgroundImage: string;
    logoImage: string;
  };
}

export type ThemesConfig = Record<Theme, ThemeConfig>;