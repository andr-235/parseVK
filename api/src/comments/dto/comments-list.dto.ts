import type { CommentWithAuthorDto } from './comment-with-author.dto';

export interface CommentsListDto {
  items: CommentWithAuthorDto[];
  total: number;
  hasMore: boolean;
  readCount: number;
  unreadCount: number;
}
