import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder';
import { CursorUtils } from '../dto/comments-cursor.dto';
import { CommentMapper } from '../mappers/comment.mapper';
import { CommentsStatsService } from '../services/comments-stats.service';
import type { CommentsCursorListDto } from '../dto/comments-cursor-list.dto';
import type { ICommentsRepository } from '../interfaces/comments-repository.interface';
import type {
  ICursorPaginationStrategy,
  CursorPaginationOptions,
} from '../interfaces/pagination-strategy.interface';
import type { CommentsFilters } from '../types/comments-filters.type';

@Injectable()
export class CursorPaginationStrategy implements ICursorPaginationStrategy {
  constructor(
    @Inject('ICommentsRepository')
    private readonly repository: ICommentsRepository,
    private readonly filterBuilder: CommentsFilterBuilder,
    private readonly mapper: CommentMapper,
    private readonly statsService: CommentsStatsService,
  ) {}

  /**
   * Выполняет cursor-based пагинацию комментариев
   */
  async execute(
    filters: CommentsFilters,
    options: CursorPaginationOptions,
  ): Promise<CommentsCursorListDto> {
    const { cursor, limit } = options;

    // Декодируем cursor если он предоставлен
    let cursorData: { publishedAt: Date; id: number } | null = null;
    if (cursor) {
      cursorData = CursorUtils.decode(cursor);
      if (!cursorData) {
        throw new BadRequestException('Invalid cursor format');
      }
    }

    // Строим базовое where условие для фильтров
    const baseWhere = this.filterBuilder.buildBaseWhere(filters);
    const readStatusWhere = this.filterBuilder.buildReadStatusWhere(
      filters.readStatus,
    );

    // Добавляем условие пагинации по cursor
    const paginationWhere: Prisma.CommentWhereInput = cursorData
      ? {
          OR: [
            {
              publishedAt: {
                lt: cursorData.publishedAt,
              },
            },
            {
              publishedAt: cursorData.publishedAt,
              id: {
                lt: cursorData.id,
              },
            },
          ],
        }
      : {};

    // Объединяем все условия для списка комментариев
    const listWhere = this.filterBuilder.mergeWhere(
      baseWhere,
      readStatusWhere,
      paginationWhere,
    );

    // Получаем комментарии (берем на 1 больше для определения hasMore)
    const comments = await this.repository.findMany({
      where: listWhere,
      take: limit + 1,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    });

    const hasMore = comments.length > limit;
    const items = this.mapper.mapMany(comments.slice(0, limit));

    // Генерируем nextCursor если есть еще элементы
    const nextCursor =
      hasMore && items.length > 0
        ? CursorUtils.encode(
            items[items.length - 1].publishedAt,
            items[items.length - 1].id,
          )
        : null;

    // Получаем статистику параллельно (без учета paginationWhere, чтобы показать общую статистику)
    const stats = await this.statsService.calculateStats(
      filters,
      filters.readStatus,
    );

    return {
      items,
      nextCursor,
      hasMore,
      total: stats.total,
      readCount: stats.readCount,
      unreadCount: stats.unreadCount,
    };
  }
}
