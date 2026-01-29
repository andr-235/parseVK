import { Inject, Injectable } from '@nestjs/common';

import { CommentMapper } from './mappers/comment.mapper.js';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy.js';
import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy.js';

import type { CommentWithAuthorDto } from './dto/comment-with-author.dto.js';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto.js';
import type { CommentsListDto } from './dto/comments-list.dto.js';

import type {
  CommentsCursorOptions,
  CommentsQueryOptions,
} from './types/comments-filters.type.js';
import {
  COMMENTS_REPOSITORY,
  type ICommentsRepository,
} from './interfaces/comments-repository.interface.js';

@Injectable()
export class CommentsService {
  constructor(
    @Inject(COMMENTS_REPOSITORY)
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
   * - Работает с индексом [createdAt DESC]
   *
   * Cursor format: base64("createdAt:id")
   */
  async getCommentsCursor(
    options: CommentsCursorOptions,
  ): Promise<CommentsCursorListDto> {
    const { cursor, limit, ...filters } = options;
    return this.cursorStrategy.execute(filters, { cursor, limit });
  }

  /**
   * Устанавливает статус прочтения комментария
   *
   * @param id - ID комментария
   * @param isRead - Статус прочтения (true - прочитано, false - не прочитано)
   * @returns Обновленный комментарий с автором
   */
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
