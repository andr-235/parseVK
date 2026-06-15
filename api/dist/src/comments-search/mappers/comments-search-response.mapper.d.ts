import type { CommentsSearchRequestDto } from '../dto/comments-search-request.dto.js';
import type { CommentsSearchResponseDto } from '../dto/comments-search-response.dto.js';
interface ElasticsearchHitSource {
    commentId: number;
    postId: number | null;
    commentText: string;
    postText: string | null;
}
interface ElasticsearchHit {
    _source: ElasticsearchHitSource;
    highlight?: Record<string, string[] | undefined>;
}
export interface ElasticsearchResponse {
    hits?: {
        total?: {
            value?: number;
        } | number;
        hits?: ElasticsearchHit[];
    };
}
export declare class CommentsSearchResponseMapper {
    map({ payload, response, }: {
        payload: CommentsSearchRequestDto;
        response: ElasticsearchResponse;
    }): CommentsSearchResponseDto;
    private toCommentItem;
    private groupByPost;
    private extractTotal;
}
export {};
