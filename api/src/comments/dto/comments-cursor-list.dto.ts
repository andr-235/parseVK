import type { CommentWithAuthorDto } from './comment-with-author.dto';

/**
 * DTO для ответа cursor-based pagination
 */
export interface CommentsCursorListDto {
  items: CommentWithAuthorDto[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
  readCount: number;
  unreadCount: number;
}
