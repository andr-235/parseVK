import type { AuthorSortDirection, AuthorSortField } from '../types/authors.types.js';
export declare class ListAuthorsQueryDto {
    offset?: number;
    limit?: number;
    search?: string;
    city?: string;
    verified?: boolean;
    sortBy?: AuthorSortField | null;
    sortOrder?: AuthorSortDirection | null;
}
