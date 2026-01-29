import { Module } from '@nestjs/common';

import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { CommentsStatsService } from './services/comments-stats.service.js';

import { CommentsRepository } from './repositories/comments.repository.js';

import { CommentMapper } from './mappers/comment.mapper.js';
import { CommentsFilterBuilder } from './builders/comments-filter.builder.js';

import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy.js';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy.js';

import { CommentsQueryValidator } from './validators/comments-query.validator.js';
import { COMMENTS_REPOSITORY } from './interfaces/comments-repository.interface.js';

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
];

@Module({
  controllers: [CommentsController],
  providers: [
    ...COMMENTS_PROVIDERS,
    ...PAGINATION_STRATEGIES,
    {
      provide: COMMENTS_REPOSITORY,
      useClass: CommentsRepository,
    },
  ],
  exports: [CommentsService],
})
export class CommentsModule {}
