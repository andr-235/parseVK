import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma.service';
import { CommentsRepository } from './repositories/comments.repository';
import { CommentMapper } from './mappers/comment.mapper';
import { CommentsFilterBuilder } from './builders/comments-filter.builder';
import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy';
import { CommentsQueryValidator } from './validators/comments-query.validator';

@Module({
  controllers: [CommentsController],
  providers: [
    CommentsService,
    PrismaService,
    CommentsRepository,
    {
      provide: 'ICommentsRepository',
      useClass: CommentsRepository,
    },
    CommentMapper,
    CommentsFilterBuilder,
    OffsetPaginationStrategy,
    CursorPaginationStrategy,
    CommentsQueryValidator,
  ],
  exports: [CommentsService],
})
export class CommentsModule {}
