import type { CommentWithAuthorDto } from './comment-with-author.dto.js';

export interface CommentsListDto {
  items: CommentWithAuthorDto[];
  total: number;
  hasMore: boolean;
  readCount: number;
  unreadCount: number;
}
