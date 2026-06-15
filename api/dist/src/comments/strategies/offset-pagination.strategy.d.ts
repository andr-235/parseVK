import { CommentsFilterBuilder } from '../builders/comments-filter.builder.js';
import { CommentMapper } from '../mappers/comment.mapper.js';
import { CommentsStatsService } from '../services/comments-stats.service.js';
import type { CommentsListDto } from '../dto/comments-list.dto.js';
import { type ICommentsRepository } from '../interfaces/comments-repository.interface.js';
import type { IOffsetPaginationStrategy, OffsetPaginationOptions } from '../interfaces/pagination-strategy.interface.js';
import type { CommentsFilters } from '../types/comments-filters.type.js';
export declare class OffsetPaginationStrategy implements IOffsetPaginationStrategy {
    private readonly repository;
    private readonly filterBuilder;
    private readonly mapper;
    private readonly statsService;
    constructor(repository: ICommentsRepository, filterBuilder: CommentsFilterBuilder, mapper: CommentMapper, statsService: CommentsStatsService);
    execute(filters: CommentsFilters, options: OffsetPaginationOptions): Promise<CommentsListDto>;
}
