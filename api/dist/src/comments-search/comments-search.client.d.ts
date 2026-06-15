import type { CommentsSearchConfig } from './comments-search.types.js';
export declare class CommentsSearchClient {
    private readonly config;
    readonly indexName: string;
    constructor(config: CommentsSearchConfig);
    search<TResponse>(payload: unknown): Promise<TResponse>;
    indexDocument(id: string, document: unknown): Promise<void>;
    private request;
    private buildAuthHeaders;
}
