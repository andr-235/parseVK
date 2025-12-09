import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ICommentsRepository } from '../interfaces/comments-repository.interface';
import type {
  IPaginationStrategy,
  CursorPaginationOptions,
} from '../interfaces/pagination-strategy.interface';
import type { CommentsFilters } from '../types/comments-filters.type';
import type { CommentsCursorListDto } from '../dto/comments-cursor-list.dto';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder';
import { CommentMapper } from '../mappers/comment.mapper';
import { CursorUtils } from '../dto/comments-cursor.dto';

@Injectable()
export class CursorPaginationStrategy implements IPaginationStrategy {
  constructor(
    @Inject('ICommentsRepository')
    private readonly repository: ICommentsRepository,
    private readonly filterBuilder: CommentsFilterBuilder,
    private readonly mapper: CommentMapper,
  ) {}

  async execute(
    filters: CommentsFilters,
    options: CursorPaginationOptions,
  ): Promise<CommentsCursorListDto> {
    const { cursor, limit } = options;

    let cursorData: { publishedAt: Date; id: number } | null = null;
    if (cursor) {
      cursorData = CursorUtils.decode(cursor);
      if (!cursorData) {
        throw new BadRequestException('Invalid cursor format');
      }
    }

    const baseWhere: Prisma.CommentWhereInput =
      this.filterBuilder.buildBaseWhere(filters);
    const readStatusWhere: Prisma.CommentWhereInput =
      this.filterBuilder.buildReadStatusWhere(filters.readStatus);

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

    const listWhere: Prisma.CommentWhereInput = this.filterBuilder.mergeWhere(
      baseWhere,
      readStatusWhere,
      paginationWhere,
    );
    const totalWhere: Prisma.CommentWhereInput = this.filterBuilder.mergeWhere(
      baseWhere,
      readStatusWhere,
    );
    const readWhere: Prisma.CommentWhereInput = this.filterBuilder.mergeWhere(
      baseWhere,
      {
        isRead: true,
      },
    );
    const unreadWhere: Prisma.CommentWhereInput = this.filterBuilder.mergeWhere(
      baseWhere,
      {
        isRead: false,
      },
    );

    const comments = await this.repository.findMany({
      where: listWhere as unknown,
      take: limit + 1,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    });

    const hasMore = comments.length > limit;
    const items = this.mapper.mapMany(comments.slice(0, limit));

    const nextCursor =
      hasMore && items.length > 0
        ? CursorUtils.encode(
            items[items.length - 1].publishedAt,
            items[items.length - 1].id,
          )
        : null;

    const [total, readCount, unreadCount] = await Promise.all([
      this.repository.count({
        where: totalWhere,
      }),
      this.repository.count({
        where: readWhere,
      }),
      this.repository.count({
        where: unreadWhere,
      }),
    ]);

    return {
      items,
      nextCursor,
      hasMore,
      total,
      readCount,
      unreadCount,
    };
  }
}
