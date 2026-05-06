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
  { id: 'article-one',   name: 'Launch Post', Component: ArticleOne,   content: DEFAULT_ARTICLE_CONTENT },
];
