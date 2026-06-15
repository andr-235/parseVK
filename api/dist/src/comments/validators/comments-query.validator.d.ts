import type { KeywordSourceFilter, ReadStatusFilter } from '../types/comments-filters.type.js';
export declare class CommentsQueryValidator {
    parseKeywords(keywords?: string | string[]): string[] | undefined;
    normalizeReadStatus(value?: string): ReadStatusFilter;
    normalizeSearch(search?: string): string | undefined;
    normalizeOffset(offset: number): number;
    normalizeLimit(limit: number): number;
    normalizeLimitWithDefault(limit?: number): number;
    normalizeKeywordSource(value?: string): KeywordSourceFilter | undefined;
}
