import { Module } from '@nestjs/common';
import { CommentsFilterBuilder } from './builders/comments-filter.builder';
import { CommentsController } from './comments.controller';
import { CommentMapper } from './mappers/comment.mapper';
import { CommentsRepository } from './repositories/comments.repository';
import { CommentsStatsService } from './services/comments-stats.service';
import { CommentsService } from './comments.service';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy';
import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy';
import { CommentsQueryValidator } from './validators/comments-query.validator';

@Module({
  controllers: [CommentsController],
  providers: [
    CommentsService,
    CommentsRepository,
    {
      provide: 'ICommentsRepository',
      useClass: CommentsRepository,
    },
    CommentMapper,
    CommentsFilterBuilder,
    CommentsStatsService,
    OffsetPaginationStrategy,
    CursorPaginationStrategy,
    CommentsQueryValidator,
  ],
  exports: [CommentsService],
})
export class CommentsModule {}
