export type CommentsSearchViewMode = 'comments' | 'posts';

export interface CommentsSearchConfig {
  enabled: boolean;
  node: string;
  indexName: string;
  username?: string;
  password?: string;
}
