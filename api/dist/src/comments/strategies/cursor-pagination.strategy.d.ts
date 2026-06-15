import { CommentsFilterBuilder } from '../builders/comments-filter.builder.js';
import type { CommentsCursorListDto } from '../dto/comments-cursor-list.dto.js';
import { CommentMapper } from '../mappers/comment.mapper.js';
import { CommentsStatsService } from '../services/comments-stats.service.js';
import type { CursorPaginationOptions, ICursorPaginationStrategy } from '../interfaces/pagination-strategy.interface.js';
import type { CommentsFilters } from '../types/comments-filters.type.js';
import { type ICommentsRepository } from '../interfaces/comments-repository.interface.js';
export declare class CursorPaginationStrategy implements ICursorPaginationStrategy {
    private readonly repository;
    private readonly filterBuilder;
    private readonly mapper;
    private readonly statsService;
    constructor(repository: ICommentsRepository, filterBuilder: CommentsFilterBuilder, mapper: CommentMapper, statsService: CommentsStatsService);
    execute(filters: CommentsFilters, options: CursorPaginationOptions): Promise<CommentsCursorListDto>;
}
