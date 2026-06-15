import { CommentsFilterBuilder } from '../builders/comments-filter.builder.js';
import type { CommentWhereInput } from '../types/comment-structures.type.js';
import type { CommentsFilters } from '../types/comments-filters.type.js';
import { type ICommentsRepository } from '../interfaces/comments-repository.interface.js';
export interface CommentsStats {
    total: number;
    readCount: number;
    unreadCount: number;
}
export declare class CommentsStatsService {
    private readonly repository;
    private readonly filterBuilder;
    constructor(repository: ICommentsRepository, filterBuilder: CommentsFilterBuilder);
    calculateStats(baseFilters: CommentsFilters, readStatusFilter?: CommentsFilters['readStatus']): Promise<CommentsStats>;
    calculateStatsWithAdditionalWhere(baseFilters: CommentsFilters, readStatusFilter: CommentsFilters['readStatus'], additionalWhere: CommentWhereInput): Promise<CommentsStats>;
}
