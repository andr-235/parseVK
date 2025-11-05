import { Injectable } from '@nestjs/common';
import { CommentSource, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { VkService } from '../../vk/vk.service';
import type { CommentEntity } from '../types/comment-entity.type';

interface SaveCommentsOptions {
  source: CommentSource;
  watchlistAuthorId?: number | null;
  keywordMatches?: KeywordMatchCandidate[];
}

interface KeywordMatchCandidate {
  id: number;
  normalizedWord: string;
}

const NBSP_REGEX = /\u00a0/g;
const SOFT_HYPHEN_REGEX = /\u00ad/g;
const INVISIBLE_SPACE_REGEX = /[\u2000-\u200f\u2028\u2029\u202f\u205f\u3000]/g;
const WHITESPACE_REGEX = /\s+/g;

const normalizeForKeywordMatch = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .replace(NBSP_REGEX, ' ')
    .replace(INVISIBLE_SPACE_REGEX, ' ')
    .replace(SOFT_HYPHEN_REGEX, '')
    .replace(/ё/g, 'е')
    .replace(WHITESPACE_REGEX, ' ')
    .trim();
};

const toUpdateJsonValue = (
  value: unknown,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
};

const toCreateJsonValue = (
  value: unknown,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue => {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
};

@Injectable()
export class AuthorActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vkService: VkService,
  ) {}

  async refreshAllAuthors(batchSize = 500): Promise<number> {
    const existingAuthors = await this.prisma.author.findMany({
      select: { vkUserId: true },
      where: { vkUserId: { gt: 0 } },
      orderBy: { vkUserId: 'asc' },
    });

    if (!existingAuthors.length) {
      return 0;
    }

    let totalUpdated = 0;

    for (let index = 0; index < existingAuthors.length; index += batchSize) {
      const chunk = existingAuthors
        .slice(index, index + batchSize)
        .map((author) => author.vkUserId);

      if (!chunk.length) {
        continue;
      }

      totalUpdated += await this.saveAuthors(chunk);
    }

    return totalUpdated;
  }

  async saveAuthors(userIds: number[]): Promise<number> {
    if (!userIds.length) {
      return 0;
    }

    const uniqueIds = Array.from(new Set(userIds.filter((id) => id > 0)));
    if (!uniqueIds.length) {
      return 0;
    }

    const authors = await this.vkService.getAuthors(uniqueIds);

    for (const author of authors) {
      const updateData: Prisma.AuthorUncheckedUpdateInput = {
        firstName: author.first_name,
        lastName: author.last_name,
        deactivated: author.deactivated,
        domain: author.domain,
        screenName: author.screen_name,
        isClosed: author.is_closed,
        canAccessClosed: author.can_access_closed,
        photo50: author.photo_50,
        photo100: author.photo_100,
        photo200: author.photo_200,
        photo200Orig: author.photo_200_orig,
        photo400Orig: author.photo_400_orig,
        photoMax: author.photo_max,
        photoMaxOrig: author.photo_max_orig,
        photoId: author.photo_id,
        city: toUpdateJsonValue(author.city),
        country: toUpdateJsonValue(author.country),
        about: author.about ?? null,
        activities: author.activities ?? null,
        bdate: author.bdate ?? null,
        books: author.books ?? null,
        career: toUpdateJsonValue(author.career),
        connections: toUpdateJsonValue(author.connections),
        contacts: toUpdateJsonValue(author.contacts),
        counters: toUpdateJsonValue(author.counters),
        education: toUpdateJsonValue(author.education),
        followersCount: author.followers_count ?? null,
        homeTown: author.home_town ?? null,
        interests: author.interests ?? null,
        lastSeen: toUpdateJsonValue(author.last_seen),
        maidenName: author.maiden_name ?? null,
        military: toUpdateJsonValue(author.military),
        movies: author.movies ?? null,
        music: author.music ?? null,
        nickname: author.nickname ?? null,
        occupation: toUpdateJsonValue(author.occupation),
        personal: toUpdateJsonValue(author.personal),
        relatives: toUpdateJsonValue(author.relatives),
        relation: author.relation ?? null,
        schools: toUpdateJsonValue(author.schools),
        sex: author.sex ?? null,
        site: author.site ?? null,
        status: author.status ?? null,
        timezone: author.timezone ?? null,
        tv: author.tv ?? null,
        universities: toUpdateJsonValue(author.universities),
      };

      const createData: Prisma.AuthorUncheckedCreateInput = {
        vkUserId: author.id,
        firstName: author.first_name,
        lastName: author.last_name,
        deactivated: author.deactivated ?? null,
        domain: author.domain ?? null,
        screenName: author.screen_name ?? null,
        isClosed: author.is_closed ?? null,
        canAccessClosed: author.can_access_closed ?? null,
        photo50: author.photo_50 ?? null,
        photo100: author.photo_100 ?? null,
        photo200: author.photo_200 ?? null,
        photo200Orig: author.photo_200_orig ?? null,
        photo400Orig: author.photo_400_orig ?? null,
        photoMax: author.photo_max ?? null,
        photoMaxOrig: author.photo_max_orig ?? null,
        photoId: author.photo_id ?? null,
        city: toCreateJsonValue(author.city),
        country: toCreateJsonValue(author.country),
        about: author.about ?? null,
        activities: author.activities ?? null,
        bdate: author.bdate ?? null,
        books: author.books ?? null,
        career: toCreateJsonValue(author.career),
        connections: toCreateJsonValue(author.connections),
        contacts: toCreateJsonValue(author.contacts),
        counters: toCreateJsonValue(author.counters),
        education: toCreateJsonValue(author.education),
        followersCount: author.followers_count ?? null,
        homeTown: author.home_town ?? null,
        interests: author.interests ?? null,
        lastSeen: toCreateJsonValue(author.last_seen),
        maidenName: author.maiden_name ?? null,
        military: toCreateJsonValue(author.military),
        movies: author.movies ?? null,
        music: author.music ?? null,
        nickname: author.nickname ?? null,
        occupation: toCreateJsonValue(author.occupation),
        personal: toCreateJsonValue(author.personal),
        relatives: toCreateJsonValue(author.relatives),
        relation: author.relation ?? null,
        schools: toCreateJsonValue(author.schools),
        sex: author.sex ?? null,
        site: author.site ?? null,
        status: author.status ?? null,
        timezone: author.timezone ?? null,
        tv: author.tv ?? null,
        universities: toCreateJsonValue(author.universities),
      };

      await this.prisma.author.upsert({
        where: { vkUserId: author.id },
        update: updateData,
        create: createData,
      });
    }

    return authors.length;
  }

  async saveComments(
    comments: CommentEntity[],
    options: SaveCommentsOptions,
  ): Promise<number> {
    if (!comments.length) {
      return 0;
    }

    const keywordMatches =
      options.keywordMatches ?? (await this.loadKeywordMatchCandidates());
    const nextOptions: SaveCommentsOptions = options.keywordMatches
      ? options
      : { ...options, keywordMatches };

    let saved = 0;

    for (const comment of comments) {
      saved += await this.saveComment(comment, nextOptions);
    }

    return saved;
  }

  private async saveComment(
    comment: CommentEntity,
    options: SaveCommentsOptions,
  ): Promise<number> {
    const threadItemsJson:
      | Prisma.NullableJsonNullValueInput
      | Prisma.InputJsonValue = comment.threadItems?.length
      ? (comment.threadItems.map((item) =>
          this.serializeComment(item),
        ) as Prisma.InputJsonValue)
      : Prisma.JsonNull;

    const attachmentsJson:
      | Prisma.NullableJsonNullValueInput
      | Prisma.InputJsonValue
      | undefined =
      comment.attachments === null
        ? Prisma.JsonNull
        : comment.attachments === undefined
          ? undefined
          : (comment.attachments as Prisma.InputJsonValue);

    const parentsStackJson:
      | Prisma.NullableJsonNullValueInput
      | Prisma.InputJsonValue =
      comment.parentsStack === null
        ? Prisma.JsonNull
        : (comment.parentsStack as Prisma.InputJsonValue);

    const authorVkId = comment.fromId > 0 ? comment.fromId : null;
    const baseUpdateData: Prisma.CommentUncheckedUpdateInput = {
      postId: comment.postId,
      ownerId: comment.ownerId,
      vkCommentId: comment.vkCommentId,
      fromId: comment.fromId,
      authorVkId,
      text: comment.text,
      publishedAt: comment.publishedAt,
      likesCount: comment.likesCount,
      parentsStack: parentsStackJson,
      threadCount: comment.threadCount,
      threadItems: threadItemsJson,
      replyToUser: comment.replyToUser,
      replyToComment: comment.replyToComment,
      isDeleted: comment.isDeleted,
    };

    const watchlistAuthorId = options.watchlistAuthorId ?? null;

    if (attachmentsJson !== undefined) {
      baseUpdateData.attachments = attachmentsJson;
    }

    const updateData: Prisma.CommentUncheckedUpdateInput = {
      ...baseUpdateData,
    };

    if (options.watchlistAuthorId !== undefined) {
      updateData.watchlistAuthorId = watchlistAuthorId;
    }

    if (options.source === CommentSource.WATCHLIST) {
      updateData.source = CommentSource.WATCHLIST;
    }

    const createData: Prisma.CommentUncheckedCreateInput = {
      postId: comment.postId,
      ownerId: comment.ownerId,
      vkCommentId: comment.vkCommentId,
      fromId: comment.fromId,
      text: comment.text,
      publishedAt: comment.publishedAt,
      likesCount: comment.likesCount,
      parentsStack: parentsStackJson,
      threadCount: comment.threadCount,
      threadItems: threadItemsJson,
      replyToUser: comment.replyToUser,
      replyToComment: comment.replyToComment,
      authorVkId: authorVkId ?? undefined,
      isDeleted: comment.isDeleted,
      source: options.source,
      watchlistAuthorId,
    };

    if (attachmentsJson !== undefined) {
      createData.attachments = attachmentsJson;
    }

    const savedComment = await this.prisma.comment.upsert({
      where: {
        ownerId_vkCommentId: {
          ownerId: comment.ownerId,
          vkCommentId: comment.vkCommentId,
        },
      },
      update: updateData,
      create: createData,
    });

    await this.syncCommentKeywordMatches(
      savedComment.id,
      comment.text,
      options.keywordMatches ?? [],
    );

    let saved = 1;
    const threadItems = comment.threadItems;
    if (threadItems?.length) {
      saved += await this.saveComments(threadItems, options);
    }

    return saved;
  }

  private serializeComment(comment: CommentEntity): Record<string, unknown> {
    return {
      vkCommentId: comment.vkCommentId,
      ownerId: comment.ownerId,
      postId: comment.postId,
      fromId: comment.fromId,
      text: comment.text,
      publishedAt: comment.publishedAt.toISOString(),
      likesCount: comment.likesCount ?? null,
      parentsStack: comment.parentsStack ?? null,
      threadCount: comment.threadCount ?? null,
      threadItems: comment.threadItems?.length
        ? comment.threadItems.map((item) => this.serializeComment(item))
        : null,
      attachments: comment.attachments ?? null,
      replyToUser: comment.replyToUser ?? null,
      replyToComment: comment.replyToComment ?? null,
      isDeleted: comment.isDeleted,
    };
  }

  private async loadKeywordMatchCandidates(): Promise<KeywordMatchCandidate[]> {
    const keywords = await this.prisma.keyword.findMany({
      select: { id: true, word: true },
    });

    return keywords
      .map((keyword) => ({
        id: keyword.id,
        normalizedWord: normalizeForKeywordMatch(keyword.word),
      }))
      .filter((keyword) => keyword.normalizedWord.length > 0);
  }

  private async syncCommentKeywordMatches(
    commentId: number,
    text: string,
    keywordMatches: KeywordMatchCandidate[],
  ): Promise<void> {
    if (!keywordMatches.length) {
      await this.prisma.commentKeywordMatch.deleteMany({ where: { commentId } });
      return;
    }

    const normalizedText = normalizeForKeywordMatch(text);

    if (!normalizedText) {
      await this.prisma.commentKeywordMatch.deleteMany({ where: { commentId } });
      return;
    }

    const matchedKeywordIds = new Set(
      keywordMatches
        .filter((keyword) =>
          keyword.normalizedWord && normalizedText.includes(keyword.normalizedWord),
        )
        .map((keyword) => keyword.id),
    );

    const existingMatches = await this.prisma.commentKeywordMatch.findMany({
      where: { commentId },
      select: { keywordId: true },
    });

    const existingKeywordIds = new Set(
      existingMatches.map((match) => match.keywordId),
    );

    const toCreate = Array.from(matchedKeywordIds).filter(
      (keywordId) => !existingKeywordIds.has(keywordId),
    );
    const toDelete = Array.from(existingKeywordIds).filter(
      (keywordId) => !matchedKeywordIds.has(keywordId),
    );

    if (toCreate.length === 0 && toDelete.length === 0) {
      return;
    }

    const operations: Prisma.PrismaPromise<unknown>[] = [];

    if (toDelete.length > 0) {
      operations.push(
        this.prisma.commentKeywordMatch.deleteMany({
          where: {
            commentId,
            keywordId: { in: toDelete },
          },
        }),
      );
    }

    if (toCreate.length > 0) {
      operations.push(
        this.prisma.commentKeywordMatch.createMany({
          data: toCreate.map((keywordId) => ({ commentId, keywordId })),
          skipDuplicates: true,
        }),
      );
    }

    if (operations.length > 0) {
      await this.prisma.$transaction(operations);
    }
  }
}
