import type { SqlFragment } from '../types/authors.types.js';
export interface AuthorFiltersResult {
    sqlConditions: SqlFragment[];
}
export declare class AuthorFiltersBuilder {
    buildFilters(search: string | null | undefined, city: string | null | undefined, verified?: boolean): AuthorFiltersResult;
    private normalizeSearch;
    private buildSearchFilter;
    private buildVerifiedFilter;
    private buildCityFilter;
}
