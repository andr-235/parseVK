import type { AuthorSortField } from './types/authors.types.js';
export declare const AUTHORS_CONSTANTS: {
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly MAX_RECURSION_DEPTH: 4;
    readonly MILLISECONDS_THRESHOLD: 10000000000;
};
export declare const SORTABLE_FIELDS: ReadonlySet<AuthorSortField>;
export declare const AUTHORS_REPOSITORY: unique symbol;
