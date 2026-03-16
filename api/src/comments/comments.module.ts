import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { CommentsStatsService } from './services/comments-stats.service.js';
import { CommentsSearchService } from '../comments-search/comments-search.service.js';
import {
  COMMENTS_SEARCH_CLIENT,
  COMMENTS_SEARCH_CONFIG,
} from '../comments-search/comments-search.constants.js';
import { buildCommentsSearchConfig } from '../comments-search/comments-search.config.js';
import { CommentsSearchClient } from '../comments-search/comments-search.client.js';
import { CommentsSearchQueryBuilder } from '../comments-search/builders/comments-search-query.builder.js';
import { CommentsSearchResponseMapper } from '../comments-search/mappers/comments-search-response.mapper.js';

import { CommentsRepository } from './repositories/comments.repository.js';

import { CommentMapper } from './mappers/comment.mapper.js';
import { CommentsFilterBuilder } from './builders/comments-filter.builder.js';

import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy.js';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy.js';

import { CommentsQueryValidator } from './validators/comments-query.validator.js';
import { COMMENTS_REPOSITORY } from './interfaces/comments-repository.interface.js';
import type { AppConfig } from '../config/app.config.js';

const PAGINATION_STRATEGIES = [
  OffsetPaginationStrategy,
  CursorPaginationStrategy,
];

const COMMENTS_PROVIDERS = [
  CommentsService,
  CommentsStatsService,
  CommentMapper,
  CommentsFilterBuilder,
  CommentsQueryValidator,
  CommentsSearchService,
  CommentsSearchQueryBuilder,
  CommentsSearchResponseMapper,
];

@Module({
  controllers: [CommentsController],
  providers: [
    ...COMMENTS_PROVIDERS,
    ...PAGINATION_STRATEGIES,
    {
      provide: COMMENTS_SEARCH_CONFIG,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) =>
        buildCommentsSearchConfig({
          commentsSearchEnabled: configService.get('commentsSearchEnabled', {
            infer: true,
          }),
          elasticsearchNode: configService.get('elasticsearchNode', {
            infer: true,
          }),
          elasticsearchIndex: configService.get('elasticsearchIndex', {
            infer: true,
          }),
          elasticsearchUsername: configService.get('elasticsearchUsername', {
            infer: true,
          }),
          elasticsearchPassword: configService.get('elasticsearchPassword', {
            infer: true,
          }),
        }),
    },
    {
      provide: COMMENTS_SEARCH_CLIENT,
      inject: [COMMENTS_SEARCH_CONFIG],
      useFactory: buildClientFactory,
    },
    {
      provide: COMMENTS_REPOSITORY,
      useClass: CommentsRepository,
    },
  ],
  exports: [CommentsService],
})
export class CommentsModule {}

function buildClientFactory(config: ReturnType<typeof buildCommentsSearchConfig>) {
  return new CommentsSearchClient(config);
}
