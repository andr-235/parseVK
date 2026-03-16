import type { CommentsSearchRequestDto } from '../dto/comments-search-request.dto.js';
import type {
  CommentsSearchCommentItemDto,
  CommentsSearchPostItemDto,
  CommentsSearchResponseDto,
} from '../dto/comments-search-response.dto.js';

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
    total?: { value?: number } | number;
    hits?: ElasticsearchHit[];
  };
}

export class CommentsSearchResponseMapper {
  map({
    payload,
    response,
  }: {
    payload: CommentsSearchRequestDto;
    response: ElasticsearchResponse;
  }): CommentsSearchResponseDto {
    const items = (response.hits?.hits ?? []).map((hit) =>
      this.toCommentItem(hit),
    );

    return {
      source: 'elasticsearch',
      viewMode: payload.viewMode,
      total: this.extractTotal(response),
      page: payload.page ?? 1,
      pageSize: payload.pageSize ?? 20,
      items:
        payload.viewMode === 'posts'
          ? this.groupByPost(items)
          : items,
    };
  }

  private toCommentItem(hit: ElasticsearchHit): CommentsSearchCommentItemDto {
    return {
      type: 'comment',
      commentId: hit._source.commentId,
      postId: hit._source.postId,
      commentText: hit._source.commentText,
      postText: hit._source.postText,
      highlight: [
        ...(hit.highlight?.commentText ?? []),
        ...(hit.highlight?.postText ?? []),
      ],
    };
  }

  private groupByPost(
    items: CommentsSearchCommentItemDto[],
  ): CommentsSearchPostItemDto[] {
    const groups = new Map<number, CommentsSearchPostItemDto>();

    for (const item of items) {
      if (item.postId === null) {
        continue;
      }

      const existing = groups.get(item.postId);
      if (existing) {
        existing.comments.push(item);
        continue;
      }

      groups.set(item.postId, {
        type: 'post',
        postId: item.postId,
        postText: item.postText,
        comments: [item],
      });
    }

    return [...groups.values()];
  }

  private extractTotal(response: ElasticsearchResponse): number {
    const total = response.hits?.total;

    if (typeof total === 'number') {
      return total;
    }

    return total?.value ?? 0;
  }
}
