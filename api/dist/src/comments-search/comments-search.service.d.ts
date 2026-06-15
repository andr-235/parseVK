import { CommentsSearchQueryBuilder } from './builders/comments-search-query.builder.js';
import type { CommentsSearchRequestDto } from './dto/comments-search-request.dto.js';
import type { CommentsSearchResponseDto } from './dto/comments-search-response.dto.js';
import { CommentsSearchResponseMapper } from './mappers/comments-search-response.mapper.js';
import type { CommentsSearchConfig } from './comments-search.types.js';
interface CommentsSearchClientLike {
    search<TResponse>(payload: unknown): Promise<TResponse>;
}
export declare class CommentsSearchService {
    private readonly config;
    private readonly client;
    private readonly queryBuilder;
    private readonly responseMapper;
    constructor(config: CommentsSearchConfig, client: CommentsSearchClientLike, queryBuilder: CommentsSearchQueryBuilder, responseMapper: CommentsSearchResponseMapper);
    search(payload: CommentsSearchRequestDto): Promise<CommentsSearchResponseDto>;
}
export {};
