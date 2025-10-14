import { Injectable, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { CommentWithAuthorDto } from './dto/comment-with-author.dto';
import type { CommentsListDto } from './dto/comments-list.dto';
import type { CommentsCursorListDto } from './dto/comments-cursor-list.dto';
import { CursorUtils } from './dto/comments-cursor.dto';

interface CommentsQueryOptions {
  offset: number;
  limit: number;
}

interface CommentsCursorOptions {
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

type CommentWithOptionalAuthor = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: typeof authorSelect;
    };
  };
}>;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapComment(comment: CommentWithOptionalAuthor): CommentWithAuthorDto {
    const { author, watchlistAuthorId, ...commentData } = comment;

    return {
      ...commentData,
      watchlistAuthorId: watchlistAuthorId ?? null,
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
    };
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
  }: CommentsQueryOptions): Promise<CommentsListDto> {
    const [comments, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        skip: offset,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: authorSelect,
          },
        },
      }),
      this.prisma.comment.count(),
    ]);

    const items = comments.map((comment) => this.mapComment(comment));

    return {
      items,
      total,
      hasMore: offset + items.length < total,
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
  }: CommentsCursorOptions): Promise<CommentsCursorListDto> {
    // Декодируем cursor если есть
    let cursorData: { publishedAt: Date; id: number } | null = null;
    if (cursor) {
      cursorData = CursorUtils.decode(cursor);
      if (!cursorData) {
        throw new BadRequestException('Invalid cursor format');
      }
    }

    // Строим where clause для cursor
    const where: Prisma.CommentWhereInput = cursorData
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

    // Получаем limit + 1 для определения hasMore
    const comments = await this.prisma.comment.findMany({
      where,
      take: limit + 1,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      include: {
        author: {
          select: authorSelect,
        },
      },
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
    const total = await this.prisma.comment.count();

    return {
      items,
      nextCursor,
      hasMore,
      total,
    };
  }

  async setReadStatus(
    id: number,
    isRead: boolean,
  ): Promise<CommentWithAuthorDto> {
    const comment = await this.prisma.comment.update({
      where: { id },
      data: { isRead },
      include: {
        author: {
          select: authorSelect,
        },
      },
    });

    return this.mapComment(comment);
  }
}
