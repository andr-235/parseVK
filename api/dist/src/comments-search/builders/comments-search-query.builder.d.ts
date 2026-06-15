import type { CommentsSearchRequestDto } from '../dto/comments-search-request.dto.js';
export declare class CommentsSearchQueryBuilder {
    build(payload: CommentsSearchRequestDto): {
        from: number;
        size: number;
        query: {
            bool: {
                must: {
                    multi_match: {
                        query: string;
                        fields: string[];
                        fuzziness: string;
                        operator: string;
                    };
                }[];
                filter: Record<string, unknown>[];
            };
        };
        highlight: {
            fields: {
                commentText: {};
                postText: {};
            };
        };
        sort: ({
            _score: string;
            publishedAt?: undefined;
        } | {
            publishedAt: string;
            _score?: undefined;
        })[];
    };
}
