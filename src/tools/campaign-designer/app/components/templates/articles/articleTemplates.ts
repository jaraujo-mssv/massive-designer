import { ArticleOne } from './ArticleOne';
import { ArticleTwo } from './ArticleTwo';
import { ArticleThree } from './ArticleThree';
import { ArticleContent, ArticleProps, DEFAULT_ARTICLE_CONTENT } from './articleTypes';

export interface ArticleTemplate {
  id: string;
  name: string;
  Component: React.ComponentType<ArticleProps>;
  content: ArticleContent;
}

export const ARTICLE_TEMPLATES: ArticleTemplate[] = [
  { id: 'article-one',   name: 'Template 1', Component: ArticleOne,   content: DEFAULT_ARTICLE_CONTENT },
  { id: 'article-two',   name: 'Template 2', Component: ArticleTwo,   content: { ...DEFAULT_ARTICLE_CONTENT, bgImageUrl: '/web-render-api/Network.jpg' } },
  { id: 'article-three', name: 'Template 3', Component: ArticleThree, content: { ...DEFAULT_ARTICLE_CONTENT, bgImageUrl: '/web-render-api/World.jpg' } },
];
