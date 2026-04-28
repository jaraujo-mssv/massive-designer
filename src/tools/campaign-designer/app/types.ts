export type PostTemplateType =
  | 'blog-announcement'
  | 'logo-pair'
  | 'quote'
  | 'feature-announcement'
  | 'logo-showcase'
  | 'terminal'
  | 'hero-image'
  | 'geo-comparison';

export interface GeoPickItem {
  name: string;
  onlyHere?: boolean;
}

export interface GeoCountryItem {
  flag: string;
  country: string;
  code: string;
  picks: GeoPickItem[];
  snippet?: string;
}

export type Platform = 'linkedin' | 'twitter';
export type SidebarTab = 'posts' | 'theme';

export interface CampaignTheme {
  background: string;
  surface: string;
  accent: string;
  headingColor: string;
  bodyColor: string;
  headingFont: string;
  bodyFont: string;
}

export interface LogoItem {
  url: string;
  name: string;
}

export interface PostContent {
  // Shared / Blog Announcement
  title?: string;
  author?: string;
  authorRole?: string;
  imageUrl?: string;
  // Logo Pair
  companyLogoUrl?: string;
  companyName?: string;
  // Quote
  quoteText?: string;
  quoteAuthor?: string;
  quoteRole?: string;
  // Feature Announcement
  featureTag?: string;
  // Logo Showcase
  logos?: LogoItem[];
  showcaseTitle?: string;
  // Terminal
  codeSnippet?: string;
  codeTitle?: string;
  terminalTitle?: string;
  // Hero Image
  heroTitle?: string;
  heroImageUrl?: string;
  // Geo Comparison
  geoPrompt?: string;
  geoItems?: GeoCountryItem[];
}

export interface Post {
  id: string;
  name: string;
  templateType: PostTemplateType;
  content: PostContent;
}

export interface Campaign {
  id: string;
  name: string;
  createdAt: number;
  theme: CampaignTheme;
  posts: Post[];
}
