import { Injectable } from '@nestjs/common';
import { CommentSource } from '../types/comment-source.enum';
import { MatchSource } from '../types/match-source.enum';
import { PrismaService } from '../../prisma.service';
import { VkService } from '../../vk/vk.service';
import type { IAuthor } from '../../vk/interfaces/author.interfaces';
import type { CommentEntity } from '../types/comment-entity.type';
import {
  normalizeForKeywordMatch,
  matchesKeyword,
  type KeywordMatchCandidate,
} from '../utils/keyword-normalization.utils';
import {
  toUpdateJsonValue,
  toCreateJsonValue,
} from '../utils/prisma-json.utils';

interface SaveCommentsOptions {
  source: CommentSource;
  watchlistAuthorId?: number | null;
  keywordMatches?: KeywordMatchCandidate[];
}

/**
 * Сервис для сохранения авторов и комментариев
 *
 * Общий сервис, используемый как задачами парсинга, так и watchlist мониторингом.
 * Обеспечивает сохранение авторов, комментариев и сопоставление ключевых слов.
 */
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
      const chunk: number[] = existingAuthors
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
      const updateData = this.buildAuthorUpdateData(author);
      const createData = this.buildAuthorCreateData(author);

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
    const saveOptions: SaveCommentsOptions = { ...options, keywordMatches };

    let saved = 0;

    for (const comment of comments) {
      saved += await this.saveComment(comment, saveOptions);
    }

    return saved;
  }

  private async saveComment(
    comment: CommentEntity,
    options: SaveCommentsOptions,
  ): Promise<number> {
    const jsonFields = this.buildCommentJsonFields(comment);
    const updateData = this.buildCommentUpdateData(
      comment,
      jsonFields,
      options,
    );
    const createData = this.buildCommentCreateData(
      comment,
      jsonFields,
      options,
    );

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
      MatchSource.COMMENT,
    );

    await this.syncPostKeywordMatches(
      comment.ownerId,
      comment.postId,
      options.keywordMatches ?? [],
    );

    let saved = 1;
    if (comment.threadItems?.length) {
      saved += await this.saveComments(comment.threadItems, options);
    }

    return saved;
  }

  private buildCommentJsonFields(comment: CommentEntity): {
    threadItems: unknown;
    attachments: unknown;
    parentsStack: unknown;
  } {
    const threadItemsJson = toUpdateJsonValue(
      comment.threadItems?.length
        ? comment.threadItems.map((item) => this.serializeComment(item))
        : null,
    );

    const attachmentsJson = toUpdateJsonValue(comment.attachments);

    const parentsStackJson = toUpdateJsonValue(comment.parentsStack);

    return {
      threadItems: threadItemsJson ?? null,
      attachments: attachmentsJson,
      parentsStack: parentsStackJson ?? null,
    };
  }

  private buildCommentBaseFields(
    comment: CommentEntity,
    jsonFields: {
      threadItems: unknown;
      attachments: unknown;
      parentsStack: unknown;
    },
  ): Record<string, unknown> {
    return {
      postId: comment.postId,
      ownerId: comment.ownerId,
      vkCommentId: comment.vkCommentId,
      fromId: comment.fromId,
      text: comment.text,
      publishedAt: comment.publishedAt,
      likesCount: comment.likesCount,
      parentsStack: jsonFields.parentsStack,
      threadCount: comment.threadCount,
      threadItems: jsonFields.threadItems,
      replyToUser: comment.replyToUser,
      replyToComment: comment.replyToComment,
      isDeleted: comment.isDeleted,
      ...(jsonFields.attachments !== undefined && {
        attachments: jsonFields.attachments,
      }),
    };
  }

  private buildCommentUpdateData(
    comment: CommentEntity,
    jsonFields: {
      threadItems: unknown;
      attachments: unknown;
      parentsStack: unknown;
    },
    options: SaveCommentsOptions,
  ): Record<string, unknown> {
    const authorVkId = comment.fromId > 0 ? comment.fromId : null;

    return {
      ...this.buildCommentBaseFields(comment, jsonFields),
      authorVkId,
      ...(options.watchlistAuthorId !== undefined && {
        watchlistAuthorId: options.watchlistAuthorId ?? null,
      }),
      ...(options.source === CommentSource.WATCHLIST && {
        source: CommentSource.WATCHLIST,
      }),
    };
  }

  private buildCommentCreateData(
    comment: CommentEntity,
    jsonFields: {
      threadItems: unknown;
      attachments: unknown;
      parentsStack: unknown;
    },
    options: SaveCommentsOptions,
  ): Record<string, unknown> {
    const authorVkId = comment.fromId > 0 ? comment.fromId : null;

    return {
      ...this.buildCommentBaseFields(comment, jsonFields),
      authorVkId: authorVkId ?? undefined,
      source: options.source,
      watchlistAuthorId: options.watchlistAuthorId ?? null,
    };
  }

  private buildAuthorBaseFields(
    author: IAuthor,
    jsonValueConverter: (value: unknown) => unknown,
    useNullCoalescing: boolean,
  ): Record<string, unknown> {
    const getValue = <T>(value: T | undefined): T | null => {
      return useNullCoalescing ? (value ?? null) : (value as T);
    };

    return {
      firstName: author.first_name,
      lastName: author.last_name,
      deactivated: getValue(author.deactivated),
      domain: getValue(author.domain),
      screenName: getValue(author.screen_name),
      isClosed: getValue(author.is_closed),
      canAccessClosed: getValue(author.can_access_closed),
      photo50: getValue(author.photo_50),
      photo100: getValue(author.photo_100),
      photo200: getValue(author.photo_200),
      photo200Orig: getValue(author.photo_200_orig),
      photo400Orig: getValue(author.photo_400_orig),
      photoMax: getValue(author.photo_max),
      photoMaxOrig: getValue(author.photo_max_orig),
      photoId: getValue(author.photo_id),
      city: jsonValueConverter(author.city),
      country: jsonValueConverter(author.country),
      about: author.about ?? null,
      activities: author.activities ?? null,
      bdate: author.bdate ?? null,
      books: author.books ?? null,
      career: jsonValueConverter(author.career),
      connections: jsonValueConverter(author.connections),
      contacts: jsonValueConverter(author.contacts),
      counters: jsonValueConverter(author.counters),
      education: jsonValueConverter(author.education),
      followersCount: author.followers_count ?? null,
      homeTown: author.home_town ?? null,
      interests: author.interests ?? null,
      lastSeen: jsonValueConverter(author.last_seen),
      maidenName: author.maiden_name ?? null,
      military: jsonValueConverter(author.military),
      movies: author.movies ?? null,
      music: author.music ?? null,
      nickname: author.nickname ?? null,
      occupation: jsonValueConverter(author.occupation),
      personal: jsonValueConverter(author.personal),
      relatives: jsonValueConverter(author.relatives),
      relation: author.relation ?? null,
      schools: jsonValueConverter(author.schools),
      sex: author.sex ?? null,
      site: author.site ?? null,
      status: author.status ?? null,
      timezone: author.timezone ?? null,
      tv: author.tv ?? null,
      universities: jsonValueConverter(author.universities),
    };
  }

  private buildAuthorUpdateData(author: IAuthor): Record<string, unknown> {
    return this.buildAuthorBaseFields(author, toUpdateJsonValue, false);
  }

  private buildAuthorCreateData(author: IAuthor): Record<string, unknown> {
    return {
      vkUserId: author.id,
      ...this.buildAuthorBaseFields(author, toCreateJsonValue, true),
    };
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
      select: { id: true, word: true, isPhrase: true },
    });

    return keywords
      .map((keyword) => {
        const normalized = normalizeForKeywordMatch(keyword.word);
        return {
          id: keyword.id,
          normalizedWord: normalized,
          isPhrase: keyword.isPhrase,
        };
      })
      .filter((keyword) => keyword.normalizedWord.length > 0);
  }

  private async syncCommentKeywordMatches(
    commentId: number,
    text: string,
    keywordMatches: KeywordMatchCandidate[],
    source: MatchSource = MatchSource.COMMENT,
  ): Promise<void> {
    const normalizedText = normalizeForKeywordMatch(text);

    if (!normalizedText || !keywordMatches.length) {
      await this.deleteCommentKeywordMatches(commentId, source);
      return;
    }

    const matchedKeywordIds = this.findMatchedKeywordIdsInText(
      normalizedText,
      keywordMatches,
    );

    const { toCreate, toDelete } = await this.calculateKeywordMatchDiff(
      commentId,
      matchedKeywordIds,
      source,
    );

    if (toCreate.length === 0 && toDelete.length === 0) {
      return;
    }

    await this.applyKeywordMatchChanges(commentId, toCreate, toDelete, source);
  }

  /**
   * Удаляет все совпадения ключевых слов для комментария
   */
  private async deleteCommentKeywordMatches(
    commentId: number,
    source: MatchSource,
  ): Promise<void> {
    await this.prisma.commentKeywordMatch.deleteMany({
      where: { commentId, source },
    });
  }

  private findMatchedKeywordIdsInText(
    normalizedText: string,
    keywordMatches: KeywordMatchCandidate[],
  ): Set<number> {
    return new Set(
      keywordMatches
        .filter((keyword) => matchesKeyword(normalizedText, keyword))
        .map((keyword) => keyword.id),
    );
  }

  private async calculateKeywordMatchDiff(
    commentId: number,
    matchedKeywordIds: Set<number>,
    source: MatchSource,
  ): Promise<{
    toCreate: number[];
    toDelete: number[];
  }> {
    const existingMatches = await this.prisma.commentKeywordMatch.findMany({
      where: { commentId, source },
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

    return { toCreate, toDelete };
  }

  private async applyKeywordMatchChanges(
    commentId: number,
    toCreate: number[],
    toDelete: number[],
    source: MatchSource,
  ): Promise<void> {
    if (toDelete.length === 0 && toCreate.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      if (toDelete.length > 0) {
        await tx.commentKeywordMatch.deleteMany({
          where: {
            commentId,
            source,
            keywordId: { in: toDelete },
          },
        });
      }

      if (toCreate.length > 0) {
        await tx.commentKeywordMatch.createMany({
          data: toCreate.map((keywordId) => ({
            commentId,
            keywordId,
            source,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  private async syncPostKeywordMatches(
    ownerId: number,
    postId: number,
    keywordMatches: KeywordMatchCandidate[],
  ): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: {
        ownerId_vkPostId: {
          ownerId,
          vkPostId: postId,
        },
      },
      select: { text: true },
    });

    if (!post?.text) {
      return;
    }

    const normalizedPostText = normalizeForKeywordMatch(post.text);
    const matchedKeywordIds = normalizedPostText
      ? this.findMatchedKeywordIdsInText(normalizedPostText, keywordMatches)
      : new Set<number>();

    const comments = await this.prisma.comment.findMany({
      where: { ownerId, postId },
      select: { id: true },
    });

    if (comments.length === 0) {
      return;
    }

    const commentIds = comments.map((c) => c.id);

    if (matchedKeywordIds.size === 0) {
      await this.deleteAllPostKeywordMatches(commentIds);
      return;
    }

    const { toCreate, toDelete } = await this.calculatePostKeywordMatchDiff(
      commentIds,
      matchedKeywordIds,
    );

    await this.applyPostKeywordMatchChanges(toCreate, toDelete);
  }

  /**
   * Удаляет все совпадения ключевых слов для комментариев поста
   */
  private async deleteAllPostKeywordMatches(
    commentIds: number[],
  ): Promise<void> {
    if (commentIds.length === 0) {
      return;
    }

    await this.prisma.commentKeywordMatch.deleteMany({
      where: {
        commentId: { in: commentIds },
        source: MatchSource.POST,
      },
    });
  }

  private async calculatePostKeywordMatchDiff(
    commentIds: number[],
    matchedKeywordIds: Set<number>,
  ): Promise<{
    toCreate: Array<{ commentId: number; keywordId: number }>;
    toDelete: Array<{ commentId: number; keywordId: number }>;
  }> {
    const existingMatches = await this.prisma.commentKeywordMatch.findMany({
      where: {
        commentId: { in: commentIds },
        source: MatchSource.POST,
      },
      select: { commentId: true, keywordId: true },
    });

    const existingKeys = new Set(
      existingMatches.map((m) => `${m.commentId}-${m.keywordId}`),
    );

    const toCreate: Array<{ commentId: number; keywordId: number }> = [];
    for (const commentId of commentIds) {
      for (const keywordId of matchedKeywordIds) {
        const key = `${commentId}-${keywordId}`;
        if (!existingKeys.has(key)) {
          toCreate.push({ commentId, keywordId });
        }
      }
    }

    const toDelete: Array<{ commentId: number; keywordId: number }> =
      existingMatches
        .filter((match) => !matchedKeywordIds.has(match.keywordId))
        .map((match) => ({
          commentId: match.commentId,
          keywordId: match.keywordId,
        }));

    return { toCreate, toDelete };
  }

  private async applyPostKeywordMatchChanges(
    toCreate: Array<{ commentId: number; keywordId: number }>,
    toDelete: Array<{ commentId: number; keywordId: number }>,
  ): Promise<void> {
    if (toCreate.length === 0 && toDelete.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      if (toDelete.length > 0) {
        for (const { commentId, keywordId } of toDelete) {
          await tx.commentKeywordMatch.deleteMany({
            where: {
              commentId,
              keywordId,
              source: MatchSource.POST,
            },
          });
        }
      }

      if (toCreate.length > 0) {
        await tx.commentKeywordMatch.createMany({
          data: toCreate.map(({ commentId, keywordId }) => ({
            commentId,
            keywordId,
            source: MatchSource.POST,
          })),
          skipDuplicates: true,
        });
      }
    });
  }
}
