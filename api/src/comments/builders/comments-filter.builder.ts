import { Injectable } from '@nestjs/common';
import { MatchSource, type Prisma } from '@prisma/client';
import type {
  CommentsFilters,
  ReadStatusFilter,
} from '../types/comments-filters.type';

@Injectable()
export class CommentsFilterBuilder {
  /**
   * Строит базовое where условие на основе фильтров комментариев
   *
   * Поддерживает фильтрацию по:
   * - Ключевым словам (keywords) с опциональным источником (COMMENT/POST)
   * - Поисковому запросу (search) в тексте комментария или поста
   *
   * @param filters - Фильтры комментариев (keywords, keywordSource, search)
   * @returns Prisma where условие для фильтрации комментариев
   */
  buildBaseWhere({
    keywords,
    keywordSource,
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
      const matchSource: MatchSource | undefined = keywordSource
        ? keywordSource === 'COMMENT'
          ? MatchSource.COMMENT
          : MatchSource.POST
        : undefined;

      const keywordMatchCondition: Prisma.CommentWhereInput = {
        commentKeywordMatches: {
          some: matchSource
            ? {
                keyword: {
                  word: { in: normalizedKeywords },
                },
                source: matchSource,
              }
            : {
                keyword: {
                  word: { in: normalizedKeywords },
                },
              },
        },
      };

      conditions.push(keywordMatchCondition);
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

  /**
   * Строит where условие для фильтрации по статусу прочтения
   *
   * @param readStatus - Статус прочтения: 'all' (все), 'read' (прочитанные), 'unread' (непрочитанные)
   * @returns Prisma where условие или пустой объект для 'all'
   */
  buildReadStatusWhere(
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

  /**
   * Объединяет несколько where условий через AND
   *
   * Игнорирует пустые и undefined условия.
   * Если остается одно условие, возвращает его напрямую (без AND).
   *
   * @param wheres - Массив where условий для объединения
   * @returns Объединенное where условие или пустой объект
   */
  mergeWhere(
    ...wheres: Array<Prisma.CommentWhereInput | undefined>
  ): Prisma.CommentWhereInput {
    const normalized = wheres.filter(
      (where) => where && Object.keys(where).length > 0,
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
   * Строит полное where условие, объединяя базовые фильтры и фильтр по статусу прочтения
   *
   * @param filters - Все фильтры комментариев включая readStatus
   * @returns Полное Prisma where условие для фильтрации комментариев
   */
  buildWhere(filters: CommentsFilters): Prisma.CommentWhereInput {
    const baseWhere = this.buildBaseWhere(filters);
    const readStatusWhere = this.buildReadStatusWhere(filters.readStatus);
    return this.mergeWhere(baseWhere, readStatusWhere);
  }
}
