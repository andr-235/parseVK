import type { CommentsCursorListDto } from '../dto/comments-cursor-list.dto';
import type { CommentsListDto } from '../dto/comments-list.dto';
import type { CommentsFilters } from '../types/comments-filters.type';

/**
 * Опции для offset-based пагинации
 */
export interface OffsetPaginationOptions {
  offset: number;
  limit: number;
}

/**
 * Опции для cursor-based пагинации
 */
export interface CursorPaginationOptions {
  cursor?: string;
  limit: number;
}

/**
 * Стратегия для offset-based пагинации комментариев
 */
export interface IOffsetPaginationStrategy {
  execute(
    filters: CommentsFilters,
    options: OffsetPaginationOptions,
  ): Promise<CommentsListDto>;
}

/**
 * Стратегия для cursor-based пагинации комментариев
 */
export interface ICursorPaginationStrategy {
  execute(
    filters: CommentsFilters,
    options: CursorPaginationOptions,
  ): Promise<CommentsCursorListDto>;
}
