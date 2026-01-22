import { Module } from '@nestjs/common';

import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsStatsService } from './services/comments-stats.service';

import { CommentsRepository } from './repositories/comments.repository';

import { CommentMapper } from './mappers/comment.mapper';
import { CommentsFilterBuilder } from './builders/comments-filter.builder';

import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy';

import { CommentsQueryValidator } from './validators/comments-query.validator';
import { COMMENTS_REPOSITORY } from './interfaces/comments-repository.interface';

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
