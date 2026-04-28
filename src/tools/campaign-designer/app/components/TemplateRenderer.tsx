import { CampaignTheme, Platform, Post } from '../types';
import { BlogAnnouncement } from './templates/BlogAnnouncement';
import { LogoPair } from './templates/LogoPair';
import { Quote } from './templates/Quote';
import { FeatureAnnouncement } from './templates/FeatureAnnouncement';
import { LogoShowcase } from './templates/LogoShowcase';
import { Terminal } from './templates/Terminal';
import { HeroImage } from './templates/HeroImage';
import { GeoComparison } from './templates/GeoComparison';

interface Props {
  post: Post;
  theme: CampaignTheme;
  platform: Platform;
}

export function TemplateRenderer({ post, theme, platform }: Props) {
  const props = { content: post.content, theme, platform };

  switch (post.templateType) {
    case 'blog-announcement':   return <BlogAnnouncement {...props} />;
    case 'logo-pair':           return <LogoPair {...props} />;
    case 'quote':               return <Quote {...props} />;
    case 'feature-announcement':return <FeatureAnnouncement {...props} />;
    case 'logo-showcase':       return <LogoShowcase {...props} />;
    case 'terminal':            return <Terminal {...props} />;
    case 'hero-image':          return <HeroImage {...props} />;
    case 'geo-comparison':      return <GeoComparison {...props} />;
    default:                    return null;
  }
}
