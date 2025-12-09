import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { MatchSource } from '@prisma/client';
import type {
  CommentsFilters,
  ReadStatusFilter,
} from '../types/comments-filters.type';

@Injectable()
export class CommentsFilterBuilder {
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

  private isWhereEmpty(where?: Prisma.CommentWhereInput): boolean {
    if (!where) {
      return true;
    }

    return Object.keys(where).length === 0;
  }

  mergeWhere(
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

  buildWhere(filters: CommentsFilters): Prisma.CommentWhereInput {
    const baseWhere = this.buildBaseWhere(filters);
    const readStatusWhere = this.buildReadStatusWhere(filters.readStatus);
    return this.mergeWhere(baseWhere, readStatusWhere);
  }
}
