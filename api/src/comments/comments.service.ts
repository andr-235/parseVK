import { Inject, Injectable } from '@nestjs/common';
import { CommentMapper } from './mappers/comment.mapper';
import { OffsetPaginationStrategy } from './strategies/offset-pagination.strategy';
import { CursorPaginationStrategy } from './strategies/cursor-pagination.strategy';
import { CommentsQueryValidator } from './validators/comments-query.validator';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';
import type { CommentsListDto } from './dto/comments-list.dto';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto';
import type { ICommentsRepository } from './interfaces/comments-repository.interface';
import type {
  CommentsQueryOptions,
  CommentsCursorOptions,
} from './types/comments-filters.type';

@Injectable()
export class CommentsService {
  constructor(
    @Inject('ICommentsRepository')
    private readonly repository: ICommentsRepository,
    private readonly offsetStrategy: OffsetPaginationStrategy,
    private readonly cursorStrategy: CursorPaginationStrategy,
    private readonly mapper: CommentMapper,
    private readonly queryValidator: CommentsQueryValidator,
  ) {}

  /**
   * Обрабатывает запрос на получение комментариев с offset-based pagination
   */
  async getCommentsFromRequest(
    offset: number,
    limit: number,
    keywordsParam?: string | string[],
    keywordSourceParam?: string,
    readStatusParam?: string,
    search?: string,
  ): Promise<CommentsListDto> {
    const normalizedOffset = this.queryValidator.normalizeOffset(offset);
    const normalizedLimit = this.queryValidator.normalizeLimit(limit);
    const keywords = this.queryValidator.parseKeywords(keywordsParam);
    const keywordSource =
      this.queryValidator.normalizeKeywordSource(keywordSourceParam);
    const readStatus = this.queryValidator.normalizeReadStatus(readStatusParam);
    const normalizedSearch = this.queryValidator.normalizeSearch(search);

    return this.getComments({
      offset: normalizedOffset,
      limit: normalizedLimit,
      keywords,
      keywordSource,
      readStatus,
      search: normalizedSearch,
    });
  }

  /**
   * Обрабатывает запрос на получение комментариев с cursor-based pagination
   */
  async getCommentsCursorFromRequest(
    cursor?: string,
    limit?: number,
    keywordsParam?: string | string[],
    keywordSourceParam?: string,
    readStatusParam?: string,
    search?: string,
  ): Promise<CommentsCursorListDto> {
    const normalizedLimit =
      this.queryValidator.normalizeLimitWithDefault(limit);
    const keywords = this.queryValidator.parseKeywords(keywordsParam);
    const keywordSource =
      this.queryValidator.normalizeKeywordSource(keywordSourceParam);
    const readStatus = this.queryValidator.normalizeReadStatus(readStatusParam);
    const normalizedSearch = this.queryValidator.normalizeSearch(search);

    return this.getCommentsCursor({
      cursor,
      limit: normalizedLimit,
      keywords,
      keywordSource,
      readStatus,
      search: normalizedSearch,
    });
  }

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
