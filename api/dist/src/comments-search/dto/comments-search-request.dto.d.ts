import type { KeywordSourceFilter, ReadStatusFilter } from '../../comments/types/comments-filters.type.js';
import type { CommentsSearchViewMode } from '../comments-search.types.js';
export declare class CommentsSearchRequestDto {
    query: string;
    viewMode: CommentsSearchViewMode;
    page?: number;
    pageSize?: number;
    keywords?: string[];
    keywordSource?: KeywordSourceFilter;
    readStatus?: ReadStatusFilter;
}
