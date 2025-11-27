import { Injectable, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';
import type { CommentsListDto } from './dto/comments-list.dto';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto';
import { CursorUtils } from './dto/comments-cursor.dto';

type ReadStatusFilter = 'all' | 'read' | 'unread';

interface CommentsFilters {
  keywords?: string[];
  search?: string;
  readStatus?: ReadStatusFilter;
}

interface CommentsQueryOptions extends CommentsFilters {
  offset: number;
  limit: number;
}

interface CommentsCursorOptions extends CommentsFilters {
  cursor?: string;
  limit: number;
}

const authorSelect = {
  vkUserId: true,
  firstName: true,
  lastName: true,
  photo50: true,
  photo100: true,
  photo200Orig: true,
} satisfies Prisma.AuthorSelect;

const keywordSelect = {
  id: true,
  word: true,
  category: true,
} satisfies Prisma.KeywordSelect;

const commentInclude = {
  author: {
    select: authorSelect,
  },
  commentKeywordMatches: {
    include: {
      keyword: {
        select: keywordSelect,
      },
    },
  },
  post: {
    select: {
      text: true,
    },
  },
} satisfies Prisma.CommentInclude;

type CommentWithRelations = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapComment(comment: CommentWithRelations): CommentWithAuthorDto {
    const { author, watchlistAuthorId, commentKeywordMatches, post, ...commentData } =
      comment;

    const matchedKeywords = commentKeywordMatches.map((match) => ({
      id: match.keyword.id,
      word: match.keyword.word,
      category: match.keyword.category,
    }));

    return {
      ...commentData,
      watchlistAuthorId: watchlistAuthorId ?? null,
      postText: post?.text ?? null,
      author: author
        ? {
            vkUserId: author.vkUserId,
            firstName: author.firstName,
            lastName: author.lastName,
            logo:
              author.photo200Orig ?? author.photo100 ?? author.photo50 ?? null,
          }
        : null,
      isWatchlisted: watchlistAuthorId != null,
      matchedKeywords,
    };
  }

  private buildBaseWhere({
    keywords,
    search,
  }: CommentsFilters): Prisma.CommentWhereInput {
    const conditions: Prisma.CommentWhereInput[] = [];

    const normalizedKeywords = Array.from(
      new Set(
        (keywords ?? [])
          .map((keyword) => keyword.trim().toLowerCase())
          .filter((keyword) => keyword.length > 0),
      ),
    );

    if (normalizedKeywords.length > 0) {
      conditions.push({
        commentKeywordMatches: {
          some: {
            keyword: {
              word: { in: normalizedKeywords },
            },
          },
        },
      });
    }

    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      conditions.push({
        OR: [
          {
            text: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
          {
            post: {
              text: {
                contains: normalizedSearch,
                mode: 'insensitive',
              },
            },
          },
        ],
      });
    }

    if (conditions.length === 0) {
      return {};
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return { AND: conditions };
  }

  private buildReadStatusWhere(
    readStatus?: ReadStatusFilter,
  ): Prisma.CommentWhereInput {
    if (readStatus === 'read') {
      return { isRead: true };
    }

    if (readStatus === 'unread') {
      return { isRead: false };
    }

    return {};
  }

  private isWhereEmpty(where?: Prisma.CommentWhereInput): boolean {
    if (!where) {
      return true;
    }

    return Object.keys(where).length === 0;
  }

  private mergeWhere(
    ...wheres: Array<Prisma.CommentWhereInput | undefined>
  ): Prisma.CommentWhereInput {
    const normalized = wheres.filter(
      (where) => where && !this.isWhereEmpty(where),
    ) as Prisma.CommentWhereInput[];

    if (normalized.length === 0) {
      return {};
    }

    if (normalized.length === 1) {
      return normalized[0];
    }

    return { AND: normalized };
  }

  /**
   * Получить комментарии с offset-based pagination (legacy)
   *
   * Используется для обратной совместимости.
   * Для новых реализаций используйте getCommentsCursor()
   */
  async getComments({
    offset,
    limit,
    keywords,
    readStatus,
    search,
  }: CommentsQueryOptions): Promise<CommentsListDto> {
    const baseWhere = this.buildBaseWhere({ keywords, search });
    const readStatusWhere = this.buildReadStatusWhere(readStatus);
    const listWhere = this.mergeWhere(baseWhere, readStatusWhere);
    const totalWhere = this.mergeWhere(baseWhere, readStatusWhere);
    const readWhere = this.mergeWhere(baseWhere, { isRead: true });
    const unreadWhere = this.mergeWhere(baseWhere, { isRead: false });

    const [comments, total, readCount, unreadCount] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where: listWhere,
        skip: offset,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: commentInclude,
      }),
      this.prisma.comment.count({ where: totalWhere }),
      this.prisma.comment.count({ where: readWhere }),
      this.prisma.comment.count({ where: unreadWhere }),
    ]);

    const items = comments.map((comment) => this.mapComment(comment));

    return {
      items,
      total,
      hasMore: offset + items.length < total,
      readCount,
      unreadCount,
    };
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
  async getCommentsCursor({
    cursor,
    limit,
    keywords,
    readStatus,
    search,
  }: CommentsCursorOptions): Promise<CommentsCursorListDto> {
    // Декодируем cursor если есть
    let cursorData: { publishedAt: Date; id: number } | null = null;
    if (cursor) {
      cursorData = CursorUtils.decode(cursor);
      if (!cursorData) {
        throw new BadRequestException('Invalid cursor format');
      }
    }

    const baseWhere = this.buildBaseWhere({ keywords, search });
    const readStatusWhere = this.buildReadStatusWhere(readStatus);

    // Строим where clause для cursor
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

    const listWhere = this.mergeWhere(baseWhere, readStatusWhere, paginationWhere);
    const totalWhere = this.mergeWhere(baseWhere, readStatusWhere);
    const readWhere = this.mergeWhere(baseWhere, { isRead: true });
    const unreadWhere = this.mergeWhere(baseWhere, { isRead: false });

    // Получаем limit + 1 для определения hasMore
    const comments = await this.prisma.comment.findMany({
      where: listWhere,
      take: limit + 1,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      include: commentInclude,
    });

    // Определяем hasMore и убираем лишний элемент
    const hasMore = comments.length > limit;
    const items = comments
      .slice(0, limit)
      .map((comment) => this.mapComment(comment));

    // Генерируем nextCursor из последнего элемента
    const nextCursor =
      hasMore && items.length > 0
        ? CursorUtils.encode(
            items[items.length - 1].publishedAt,
            items[items.length - 1].id,
          )
        : null;

    // Получаем total count (кэшируется, так что не сильно влияет на производительность)
    const [total, readCount, unreadCount] = await this.prisma.$transaction([
      this.prisma.comment.count({ where: totalWhere }),
      this.prisma.comment.count({ where: readWhere }),
      this.prisma.comment.count({ where: unreadWhere }),
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

  async setReadStatus(
    id: number,
    isRead: boolean,
  ): Promise<CommentWithAuthorDto> {
    const comment = await this.prisma.comment.update({
      where: { id },
      data: { isRead },
      include: commentInclude,
    });

    return this.mapComment(comment);
  }
}
