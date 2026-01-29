import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';

import { CommentsFilterBuilder } from '../builders/comments-filter.builder.js';
import { CursorUtils } from '../dto/comments-cursor.dto.js';
import type { CommentsCursorListDto } from '../dto/comments-cursor-list.dto.js';
import { CommentMapper } from '../mappers/comment.mapper.js';
import { CommentsStatsService } from '../services/comments-stats.service.js';

import type {
  CursorPaginationOptions,
  ICursorPaginationStrategy,
} from '../interfaces/pagination-strategy.interface.js';
import type { CommentsFilters } from '../types/comments-filters.type.js';
import {
  COMMENTS_REPOSITORY,
  type ICommentsRepository,
} from '../interfaces/comments-repository.interface.js';

@Injectable()
export class CursorPaginationStrategy implements ICursorPaginationStrategy {
  constructor(
    @Inject(COMMENTS_REPOSITORY)
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
    let cursorData: { createdAt: Date; id: number } | null = null;
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
              createdAt: {
                lt: cursorData.createdAt,
              },
            },
            {
              createdAt: cursorData.createdAt,
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
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const hasMore = comments.length > limit;
    const items = this.mapper.mapMany(comments.slice(0, limit));

    // Генерируем nextCursor если есть еще элементы
    const lastItem = items.at(-1);
    const nextCursor =
      hasMore && lastItem
        ? CursorUtils.encode(lastItem.createdAt, lastItem.id)
        : null;

    // Получаем статистику (без paginationWhere, чтобы показать общую статистику)
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
