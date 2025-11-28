export type ReadStatusFilter = 'all' | 'read' | 'unread';
export type KeywordSourceFilter = 'COMMENT' | 'POST';

export interface CommentsFilters {
  keywords?: string[];
  keywordSource?: KeywordSourceFilter;
  search?: string;
  readStatus?: ReadStatusFilter;
}

export interface CommentsQueryOptions extends CommentsFilters {
  offset: number;
  limit: number;
}

export interface CommentsCursorOptions extends CommentsFilters {
  cursor?: string;
  limit: number;
}

