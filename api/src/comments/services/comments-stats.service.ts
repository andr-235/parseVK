import { Inject, Injectable } from '@nestjs/common';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder';
import type { ICommentsRepository } from '../interfaces/comments-repository.interface';
import type { CommentWhereInput } from '../types/comment-structures.type';
import type { CommentsFilters } from '../types/comments-filters.type';

export interface CommentsStats {
  total: number;
  readCount: number;
  unreadCount: number;
}

@Injectable()
export class CommentsStatsService {
  constructor(
    @Inject('ICommentsRepository')
    private readonly repository: ICommentsRepository,
    private readonly filterBuilder: CommentsFilterBuilder,
  ) {}

  /**
   * Подсчитывает статистику комментариев по фильтрам
   *
   * @param baseFilters - Базовые фильтры (keywords, search, keywordSource)
   * @param readStatusFilter - Фильтр по статусу прочтения (all, read, unread)
   * @returns Статистика: total, readCount, unreadCount
   */
  async calculateStats(
    baseFilters: CommentsFilters,
    readStatusFilter?: CommentsFilters['readStatus'],
  ): Promise<CommentsStats> {
    const baseWhere = this.filterBuilder.buildBaseWhere(baseFilters);
    const readStatusWhere =
      this.filterBuilder.buildReadStatusWhere(readStatusFilter);

    // Общее where условие для подсчета total (с учетом readStatus фильтра)
    const totalWhere = this.filterBuilder.mergeWhere(
      baseWhere,
      readStatusWhere,
    );

    // Where условия для подсчета прочитанных и непрочитанных
    const readWhere = this.filterBuilder.mergeWhere(baseWhere, {
      isRead: true,
    });
    const unreadWhere = this.filterBuilder.mergeWhere(baseWhere, {
      isRead: false,
    });

    // Выполняем все подсчеты параллельно
    const [total, readCount, unreadCount] = await Promise.all([
      this.repository.count({ where: totalWhere }),
      this.repository.count({ where: readWhere }),
      this.repository.count({ where: unreadWhere }),
    ]);

    return {
      total,
      readCount,
      unreadCount,
    };
  }

  /**
   * Подсчитывает статистику с дополнительным where условием
   * (например, для cursor pagination с условием по cursor)
   *
   * @param baseFilters - Базовые фильтры (keywords, search, keywordSource)
   * @param readStatusFilter - Фильтр по статусу прочтения (all, read, unread)
   * @param additionalWhere - Дополнительное where условие для фильтрации total
   * @returns Статистика: total (с учетом additionalWhere), readCount, unreadCount (без additionalWhere)
   */
  async calculateStatsWithAdditionalWhere(
    baseFilters: CommentsFilters,
    readStatusFilter: CommentsFilters['readStatus'],
    additionalWhere: CommentWhereInput,
  ): Promise<CommentsStats> {
    const baseWhere = this.filterBuilder.buildBaseWhere(baseFilters);
    const readStatusWhere =
      this.filterBuilder.buildReadStatusWhere(readStatusFilter);

    const totalWhere = this.filterBuilder.mergeWhere(
      baseWhere,
      readStatusWhere,
      additionalWhere,
    );

    const readWhere = this.filterBuilder.mergeWhere(baseWhere, {
      isRead: true,
    });
    const unreadWhere = this.filterBuilder.mergeWhere(baseWhere, {
      isRead: false,
    });

    const [total, readCount, unreadCount] = await Promise.all([
      this.repository.count({ where: totalWhere }),
      this.repository.count({ where: readWhere }),
      this.repository.count({ where: unreadWhere }),
    ]);

    return { total, readCount, unreadCount };
  }
}
