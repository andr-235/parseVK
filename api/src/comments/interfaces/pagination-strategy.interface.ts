import type { CommentsFilters } from '../types/comments-filters.type';
import type { CommentsListDto } from '../dto/comments-list.dto';
import type { CommentsCursorListDto } from '../dto/comments-cursor-list.dto';

export interface IPaginationStrategy {
  execute(
    filters: CommentsFilters,
    options: unknown,
  ): Promise<CommentsListDto | CommentsCursorListDto>;
}

export interface OffsetPaginationOptions {
  offset: number;
  limit: number;
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit: number;
}

