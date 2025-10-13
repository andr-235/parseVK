import { Injectable } from '@nestjs/common';
import { CommentSource, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { VkService } from '../../vk/vk.service';
import type { CommentEntity } from '../types/comment-entity.type';

interface SaveCommentsOptions {
  source: CommentSource;
  watchlistAuthorId?: number | null;
}

@Injectable()
export class AuthorActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vkService: VkService,
  ) {}

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
        domain: author.domain,
        screenName: author.screen_name,
        isClosed: author.is_closed,
        canAccessClosed: author.can_access_closed,
        photo50: author.photo_50,
        photo100: author.photo_100,
        photo200Orig: author.photo_200_orig,
        city: author.city as Prisma.InputJsonValue | undefined,
        country: author.country as Prisma.InputJsonValue | undefined,
      };

      const createData: Prisma.AuthorUncheckedCreateInput = {
        vkUserId: author.id,
        firstName: author.first_name,
        lastName: author.last_name,
        domain: author.domain ?? null,
        screenName: author.screen_name ?? null,
        isClosed: author.is_closed ?? null,
        canAccessClosed: author.can_access_closed ?? null,
        photo50: author.photo_50 ?? null,
        photo100: author.photo_100 ?? null,
        photo200Orig: author.photo_200_orig ?? null,
        city: author.city ? (author.city as Prisma.InputJsonValue) : Prisma.JsonNull,
        country: author.country ? (author.country as Prisma.InputJsonValue) : Prisma.JsonNull,
      };

      await this.prisma.author.upsert({
        where: { vkUserId: author.id },
        update: updateData,
        create: createData,
      });
    }

    return authors.length;
  }

  async saveComments(comments: CommentEntity[], options: SaveCommentsOptions): Promise<number> {
    if (!comments.length) {
      return 0;
    }

    let saved = 0;

    for (const comment of comments) {
      saved += await this.saveComment(comment, options);
    }

    return saved;
  }

  private async saveComment(comment: CommentEntity, options: SaveCommentsOptions): Promise<number> {
    const threadItemsJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
      comment.threadItems?.length
        ? (comment.threadItems.map((item) => this.serializeComment(item)) as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    const attachmentsJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined =
      comment.attachments === null
        ? Prisma.JsonNull
        : comment.attachments === undefined
          ? undefined
          : (comment.attachments as Prisma.InputJsonValue);

    const parentsStackJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
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

    await this.prisma.comment.upsert({
      where: {
        ownerId_vkCommentId: {
          ownerId: comment.ownerId,
          vkCommentId: comment.vkCommentId,
        },
      },
      update: updateData,
      create: createData,
    });

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
}
