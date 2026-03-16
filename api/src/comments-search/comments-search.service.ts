import { Inject, Injectable } from '@nestjs/common';
import {
  COMMENTS_SEARCH_CLIENT,
  COMMENTS_SEARCH_CONFIG,
} from './comments-search.constants.js';
import { CommentsSearchQueryBuilder } from './builders/comments-search-query.builder.js';
import type { CommentsSearchClient } from './comments-search.client.js';
import type { CommentsSearchRequestDto } from './dto/comments-search-request.dto.js';
import type { CommentsSearchResponseDto } from './dto/comments-search-response.dto.js';
import type { CommentsSearchConfig } from './comments-search.types.js';

@Injectable()
export class CommentsSearchService {
  constructor(
    @Inject(COMMENTS_SEARCH_CONFIG)
    private readonly config: CommentsSearchConfig,
    @Inject(COMMENTS_SEARCH_CLIENT)
    private readonly client: Pick<CommentsSearchClient, 'search'>,
    private readonly queryBuilder: CommentsSearchQueryBuilder,
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

    await this.client.search(this.queryBuilder.build(payload));

    return {
      source: 'elasticsearch',
      viewMode: payload.viewMode,
      total: 0,
      page,
      pageSize,
      items: [],
    };
  }
}
