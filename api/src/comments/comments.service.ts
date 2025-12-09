import { Inject, Injectable } from '@nestjs/common';
import type { ICommentsRepository } from './interfaces/comments-repository.interface';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';
import type { CommentsListDto } from './dto/comments-list.dto';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto';
import type {
  CommentsQueryOptions,
  CommentsCursorOptions,
} from './types/comments-filters.type';
import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy';
import { CommentMapper } from './mappers/comment.mapper';

@Injectable()
export class CommentsService {
  constructor(
    @Inject('ICommentsRepository')
    private readonly repository: ICommentsRepository,
    private readonly offsetStrategy: OffsetPaginationStrategy,
    private readonly cursorStrategy: CursorPaginationStrategy,
    private readonly mapper: CommentMapper,
  ) {}

  /**
   * Получить комментарии с offset-based pagination (legacy)
   *
   * Используется для обратной совместимости.
   * Для новых реализаций используйте getCommentsCursor()
   */
  async getComments(options: CommentsQueryOptions): Promise<CommentsListDto> {
    const { offset, limit, ...filters } = options;
    return this.offsetStrategy.execute(filters, { offset, limit });
  }

  /**
   * Получить комментарии с cursor-based pagination
   *
   * Преимущества:
   * - Быстрее на больших offset'ах (использует индекс вместо OFFSET scan)
   * - Нет проблемы "missing rows" при добавлении новых данных
   * - Работает с индексом [publishedAt DESC]
   *
   * Cursor format: base64("publishedAt:id")
   */
  async getCommentsCursor(
    options: CommentsCursorOptions,
  ): Promise<CommentsCursorListDto> {
    const { cursor, limit, ...filters } = options;
    return this.cursorStrategy.execute(filters, { cursor, limit });
  }

  async setReadStatus(
    id: number,
    isRead: boolean,
  ): Promise<CommentWithAuthorDto> {
    const comment = await this.repository.update({
      where: { id },
      data: { isRead },
    });

    return this.mapper.map(comment);
  }
}
