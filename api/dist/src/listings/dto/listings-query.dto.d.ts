declare const SORTABLE_FIELDS: readonly ["createdAt", "price", "publishedAt", "source", "address", "title", "sourceAuthorName", "contactPhone", "sourceAuthorUrl", "sourceParsedAt"];
export type SortableField = (typeof SORTABLE_FIELDS)[number];
export declare class ListingsQueryDto {
    page?: number;
    pageSize?: number;
    search?: string;
    source?: string;
    archived?: boolean;
    sortBy?: SortableField;
    sortOrder?: 'asc' | 'desc';
}
export {};
