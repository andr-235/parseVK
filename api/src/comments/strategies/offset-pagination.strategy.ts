import { Inject, Injectable } from '@nestjs/common';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder.js';
import { CommentMapper } from '../mappers/comment.mapper.js';
import { CommentsStatsService } from '../services/comments-stats.service.js';
import type { CommentsListDto } from '../dto/comments-list.dto.js';
import {
  COMMENTS_REPOSITORY,
  type ICommentsRepository,
} from '../interfaces/comments-repository.interface.js';
import type {
  IOffsetPaginationStrategy,
  OffsetPaginationOptions,
} from '../interfaces/pagination-strategy.interface.js';
import type { CommentsFilters } from '../types/comments-filters.type.js';

@Injectable()
export class OffsetPaginationStrategy implements IOffsetPaginationStrategy {
  constructor(
    @Inject(COMMENTS_REPOSITORY)
    private readonly repository: ICommentsRepository,
    private readonly filterBuilder: CommentsFilterBuilder,
    private readonly mapper: CommentMapper,
    private readonly statsService: CommentsStatsService,
  ) {}

  /**
   * Выполняет offset-based пагинацию комментариев
   */
  async execute(
    filters: CommentsFilters,
    options: OffsetPaginationOptions,
  ): Promise<CommentsListDto> {
    const { offset, limit } = options;

    // Строим where условие для списка комментариев
    const listWhere = this.filterBuilder.buildWhere(filters);

    // Получаем комментарии и статистику параллельно
    const [comments, stats] = await Promise.all([
      this.repository.findMany({
        where: listWhere,
        skip: offset,
        take: limit,
        orderBy: { publishedAt: 'desc' },
      }),
      this.statsService.calculateStats(filters, filters.readStatus),
    ]);

    const items = this.mapper.mapMany(comments);

    return {
      items,
      total: stats.total,
      hasMore: offset + items.length < stats.total,
      readCount: stats.readCount,
      unreadCount: stats.unreadCount,
    };
  }
}
