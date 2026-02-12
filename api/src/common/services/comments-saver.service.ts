import { Injectable, Logger } from '@nestjs/common';
import { CommentSource } from '../types/comment-source.enum.js';
import { MatchSource } from '../types/match-source.enum.js';
import { PrismaService } from '../../prisma.service.js';
import type { CommentEntity } from '../types/comment-entity.type.js';
import {
  normalizeForKeywordMatch,
  matchesKeyword,
  type KeywordMatchCandidate,
} from '../utils/keyword-normalization.utils.js';
import { toUpdateJsonValue } from '../utils/prisma-json.utils.js';

type JsonUpdateValue = ReturnType<typeof toUpdateJsonValue>;

interface SerializedComment {
  vkCommentId: number;
  ownerId: number;
  postId: number;
  fromId: number;
  text: string;
  publishedAt: string;
  likesCount: number | null;
  parentsStack: unknown;
  threadCount: number | null;
  threadItems: unknown[] | null;
  attachments: unknown;
  replyToUser: number | null;
  replyToComment: number | null;
  isDeleted: boolean;
}

export interface SaveCommentsOptions {
  source: CommentSource;
  watchlistAuthorId?: number | null;
  keywordMatches?: KeywordMatchCandidate[];
}

/**
 * Сервис для сохранения комментариев в БД и синхронизации keyword-матчей.
 *
 * Единственная ответственность — upsert комментариев (включая вложенные thread items)
 * и поддержание актуальности CommentKeywordMatch записей.
 */
@Injectable()
export class CommentsSaverService {
  private readonly logger = new Logger(CommentsSaverService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Сохраняет массив комментариев в БД.
   *
   * @param comments - массив комментариев (включая thread items рекурсивно)
   * @param options - источник, watchlistAuthorId, опциональные keyword-кандидаты
   * @returns количество сохранённых комментариев
   */
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

    this.logger.debug(
      `[saveComments] Сохраняем ${comments.length} комментариев, source=${options.source}`,
      { keywordCandidates: keywordMatches.length },
    );

    let saved = 0;

    for (const comment of comments) {
      saved += await this.saveComment(comment, saveOptions);
    }

    this.logger.debug(`[saveComments] Сохранено: ${saved}`);
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
    threadItems: JsonUpdateValue;
    attachments: JsonUpdateValue;
    parentsStack: JsonUpdateValue;
  } {
    const threadItemsJson = toUpdateJsonValue(
      comment.threadItems?.length
        ? comment.threadItems.map(
            (item) => this.serializeComment(item) as unknown,
          )
        : null,
    );

    const attachmentsJson = toUpdateJsonValue(comment.attachments);
    const parentsStackJson = toUpdateJsonValue(comment.parentsStack);

    return {
      threadItems: threadItemsJson,
      attachments: attachmentsJson,
      parentsStack: parentsStackJson,
    };
  }

  private buildCommentBaseFields(
    comment: CommentEntity,
    jsonFields: {
      threadItems: JsonUpdateValue;
      attachments: JsonUpdateValue;
      parentsStack: JsonUpdateValue;
    },
  ) {
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
      threadItems: JsonUpdateValue;
      attachments: JsonUpdateValue;
      parentsStack: JsonUpdateValue;
    },
    options: SaveCommentsOptions,
  ) {
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
      threadItems: JsonUpdateValue;
      attachments: JsonUpdateValue;
      parentsStack: JsonUpdateValue;
    },
    options: SaveCommentsOptions,
  ) {
    const authorVkId = comment.fromId > 0 ? comment.fromId : null;

    return {
      ...this.buildCommentBaseFields(comment, jsonFields),
      authorVkId: authorVkId ?? undefined,
      source: options.source,
      watchlistAuthorId: options.watchlistAuthorId ?? null,
    };
  }

  private serializeComment(comment: CommentEntity): SerializedComment {
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
        ? comment.threadItems.map(
            (item) => this.serializeComment(item) as unknown,
          )
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
  ): Promise<{ toCreate: number[]; toDelete: number[] }> {
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
          where: { commentId, source, keywordId: { in: toDelete } },
        });
      }

      if (toCreate.length > 0) {
        await tx.commentKeywordMatch.createMany({
          data: toCreate.map((keywordId) => ({ commentId, keywordId, source })),
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
      where: { ownerId_vkPostId: { ownerId, vkPostId: postId } },
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

  private async deleteAllPostKeywordMatches(
    commentIds: number[],
  ): Promise<void> {
    if (commentIds.length === 0) {
      return;
    }

    await this.prisma.commentKeywordMatch.deleteMany({
      where: { commentId: { in: commentIds }, source: MatchSource.POST },
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
      where: { commentId: { in: commentIds }, source: MatchSource.POST },
      select: { commentId: true, keywordId: true },
    });

    const existingKeys = new Set(
      existingMatches.map((m) => `${m.commentId}-${m.keywordId}`),
    );

    const toCreate: Array<{ commentId: number; keywordId: number }> = [];
    for (const commentId of commentIds) {
      for (const keywordId of matchedKeywordIds) {
        if (!existingKeys.has(`${commentId}-${keywordId}`)) {
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
            where: { commentId, keywordId, source: MatchSource.POST },
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
