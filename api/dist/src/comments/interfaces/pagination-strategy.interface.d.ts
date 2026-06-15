import type { CommentsCursorListDto } from '../dto/comments-cursor-list.dto.js';
import type { CommentsListDto } from '../dto/comments-list.dto.js';
import type { CommentsFilters } from '../types/comments-filters.type.js';
export interface OffsetPaginationOptions {
    offset: number;
    limit: number;
}
export interface CursorPaginationOptions {
    cursor?: string;
    limit: number;
}
export interface IOffsetPaginationStrategy {
    execute(filters: CommentsFilters, options: OffsetPaginationOptions): Promise<CommentsListDto>;
}
export interface ICursorPaginationStrategy {
    execute(filters: CommentsFilters, options: CursorPaginationOptions): Promise<CommentsCursorListDto>;
}
