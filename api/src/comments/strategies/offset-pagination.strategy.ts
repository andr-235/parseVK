import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ICommentsRepository } from '../interfaces/comments-repository.interface';
import type {
  IPaginationStrategy,
  OffsetPaginationOptions,
} from '../interfaces/pagination-strategy.interface';
import type { CommentsFilters } from '../types/comments-filters.type';
import type { CommentsListDto } from '../dto/comments-list.dto';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder';
import { CommentMapper } from '../mappers/comment.mapper';

@Injectable()
export class OffsetPaginationStrategy implements IPaginationStrategy {
  constructor(
    @Inject('ICommentsRepository')
    private readonly repository: ICommentsRepository,
    private readonly filterBuilder: CommentsFilterBuilder,
    private readonly mapper: CommentMapper,
  ) {}

  async execute(
    filters: CommentsFilters,
    options: OffsetPaginationOptions,
  ): Promise<CommentsListDto> {
    const { offset, limit } = options;

    const baseWhere = this.filterBuilder.buildBaseWhere(filters);
    const readStatusWhere = this.filterBuilder.buildReadStatusWhere(
      filters.readStatus,
    );
    const listWhere = this.filterBuilder.mergeWhere(baseWhere, readStatusWhere);
    const totalWhere = this.filterBuilder.mergeWhere(
      baseWhere,
      readStatusWhere,
    );
    const readWhere = this.filterBuilder.mergeWhere(baseWhere, {
      isRead: true,
    });
    const unreadWhere = this.filterBuilder.mergeWhere(baseWhere, {
      isRead: false,
    });

    const [comments, total, readCount, unreadCount] = await Promise.all([
      this.repository.findMany({
        where: listWhere as unknown,
        skip: offset,
        take: limit,
        orderBy: { publishedAt: 'desc' },
      }),
      this.repository.count({
        where: totalWhere as unknown,
      }),
      this.repository.count({
        where: readWhere as unknown,
      }),
      this.repository.count({
        where: unreadWhere as unknown,
      }),
    ]);

    const items = this.mapper.mapMany(comments);

    return {
      items,
      total,
      hasMore: offset + items.length < total,
      readCount,
      unreadCount,
    };
  }
}
