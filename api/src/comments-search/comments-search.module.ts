import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/app.config.js';
import { CommentsSearchClient } from './comments-search.client.js';
import { buildCommentsSearchConfig } from './comments-search.config.js';
import {
  COMMENTS_SEARCH_CLIENT,
  COMMENTS_SEARCH_CONFIG,
} from './comments-search.constants.js';
import { CommentsSearchService } from './comments-search.service.js';
import { CommentsSearchQueryBuilder } from './builders/comments-search-query.builder.js';
import { CommentsSearchResponseMapper } from './mappers/comments-search-response.mapper.js';
import { CommentsSearchDocumentMapper } from './mappers/comments-search-document.mapper.js';
import { CommentsSearchIndexerService } from './services/comments-search-indexer.service.js';

@Module({
  providers: [
    CommentsSearchService,
    CommentsSearchQueryBuilder,
    CommentsSearchResponseMapper,
    CommentsSearchDocumentMapper,
    CommentsSearchIndexerService,
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
      useFactory: (config: ReturnType<typeof buildCommentsSearchConfig>) =>
        new CommentsSearchClient(config),
    },
  ],
  exports: [CommentsSearchService, CommentsSearchIndexerService],
})
export class CommentsSearchModule {}
