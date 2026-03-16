import { Inject, Injectable } from '@nestjs/common';
import {
  COMMENTS_SEARCH_CLIENT,
  COMMENTS_SEARCH_CONFIG,
} from './comments-search.constants.js';
import { CommentsSearchQueryBuilder } from './builders/comments-search-query.builder.js';
import type { CommentsSearchClient } from './comments-search.client.js';
import type { CommentsSearchRequestDto } from './dto/comments-search-request.dto.js';
import type { CommentsSearchResponseDto } from './dto/comments-search-response.dto.js';
import {
  CommentsSearchResponseMapper,
  type ElasticsearchResponse,
} from './mappers/comments-search-response.mapper.js';
import type { CommentsSearchConfig } from './comments-search.types.js';

interface CommentsSearchClientLike {
  search<TResponse>(payload: unknown): Promise<TResponse>;
}

@Injectable()
export class CommentsSearchService {
  constructor(
    @Inject(COMMENTS_SEARCH_CONFIG)
    private readonly config: CommentsSearchConfig,
    @Inject(COMMENTS_SEARCH_CLIENT)
    private readonly client: CommentsSearchClientLike,
    private readonly queryBuilder: CommentsSearchQueryBuilder,
    private readonly responseMapper: CommentsSearchResponseMapper,
  ) {}

  async search(
    payload: CommentsSearchRequestDto,
  ): Promise<CommentsSearchResponseDto> {
    const page = payload.page ?? 1;
    const pageSize = payload.pageSize ?? 20;

    if (!this.config.enabled) {
      return {
        source: 'fallback',
        viewMode: payload.viewMode,
        total: 0,
        page,
        pageSize,
        items: [],
      };
    }

    const response = await this.client.search<ElasticsearchResponse>(
      this.queryBuilder.build(payload),
    );

    return this.responseMapper.map({
      payload: {
        ...payload,
        page,
        pageSize,
      },
      response,
    });
  }
}
