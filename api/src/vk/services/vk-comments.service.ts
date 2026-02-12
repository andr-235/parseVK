import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { APIError, VK } from 'vk-io';
import type { Objects } from 'vk-io';
import type { IComment } from '../interfaces/comment.interfaces.js';
import {
  buildCommentsCacheKey,
  CACHE_TTL,
} from '../../common/constants/cache-keys.js';
import { VkApiRequestManager } from './vk-api-request-manager.service.js';
import { VK_INSTANCE } from './vk-groups.service.js';
import type {
  GetCommentsOptions,
  GetCommentsResponse,
} from '../interfaces/vk-service.interfaces.js';

@Injectable()
export class VkCommentsService {
  private readonly logger = new Logger(VkCommentsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(VK_INSTANCE) private readonly vk: VK,
    private readonly requestManager: VkApiRequestManager,
  ) {}

  async getComments(options: GetCommentsOptions): Promise<GetCommentsResponse> {
    const {
      ownerId,
      postId,
      count = 100,
      needLikes = true,
      extended = true,
      offset = 0,
      sort,
      previewLength,
      commentId,
      startCommentId,
      threadItemsCount,
      fields,
    } = options;

    const isCacheable = !commentId && !startCommentId && !fields;
    const cacheKey = isCacheable
      ? buildCommentsCacheKey(ownerId, postId, offset)
      : null;

    if (cacheKey) {
      const cached = await this.cacheManager.get<GetCommentsResponse>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache HIT: ${cacheKey}`);
        return cached;
      }
      this.logger.debug(`Cache MISS: ${cacheKey}`);
    }

    try {
      const response = await this.requestManager.execute(
        () =>
          this.vk.api.wall.getComments({
            owner_id: ownerId,
            post_id: postId,
            need_likes: needLikes ? 1 : 0,
            extended: extended ? 1 : 0,
            count: Math.max(0, Math.min(count, 100)),
            offset,
            sort,
            preview_length: previewLength,
            comment_id: commentId,
            start_comment_id: startCommentId,
            thread_items_count: threadItemsCount,
            fields,
          }),
        {
          method: 'wall.getComments',
          key: `comments:${ownerId}:${postId}`,
        },
      );

      const items = this.mapComments(response.items ?? [], { ownerId, postId });

      const result = {
        ...response,
        items,
      };

      if (cacheKey) {
        await this.cacheManager.set(
          cacheKey,
          result,
          CACHE_TTL.VK_COMMENTS * 1000,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof APIError && error.code === 15) {
        return {
          count: 0,
          current_level_count: 0,
          can_post: 0,
          show_reply_button: 0,
          groups_can_post: 0,
          items: [],
          profiles: [],
          groups: [],
        };
      }

      throw error;
    }
  }

  async getAuthorCommentsForPost(options: {
    ownerId: number;
    postId: number;
    authorVkId: number;
    baseline?: Date | null;
    batchSize?: number;
    maxPages?: number;
    threadItemsCount?: number;
  }): Promise<IComment[]> {
    const {
      ownerId,
      postId,
      authorVkId,
      baseline = null,
      batchSize = 100,
      maxPages = 5,
      threadItemsCount = 10,
    } = options;

    const baselineTimestamp = baseline ? baseline.getTime() : null;

    let offset = 0;
    let page = 0;
    const collected: IComment[] = [];

    while (page < maxPages) {
      const response = await this.getComments({
        ownerId,
        postId,
        count: batchSize,
        offset,
        sort: 'desc',
        needLikes: false,
        extended: false,
        threadItemsCount,
      });

      const items = response.items ?? [];

      if (!items.length) {
        break;
      }

      const filtered = this.filterCommentsByAuthor(
        items,
        authorVkId,
        baselineTimestamp,
      );

      if (filtered.length) {
        collected.push(...filtered);
      }

      offset += items.length;
      page += 1;

      if (baselineTimestamp !== null) {
        const oldest = this.findOldestTimestamp(items);

        if (oldest !== null && oldest <= baselineTimestamp) {
          break;
        }
      }

      if (offset >= (response.count ?? 0)) {
        break;
      }
    }

    return collected;
  }

  private mapComments(
    items: Objects.WallWallComment[],
    defaults: { ownerId: number; postId: number },
  ): IComment[] {
    return items.map((item) => this.mapComment(item, defaults));
  }

  private filterCommentsByAuthor(
    items: IComment[],
    authorVkId: number,
    baselineTimestamp: number | null,
  ): IComment[] {
    const result: IComment[] = [];

    for (const item of items) {
      const childItems = item.threadItems?.length
        ? this.filterCommentsByAuthor(
            item.threadItems,
            authorVkId,
            baselineTimestamp,
          )
        : [];

      const isAuthorComment = item.fromId === authorVkId;
      const isAfterBaseline =
        baselineTimestamp === null ||
        item.publishedAt.getTime() > baselineTimestamp;

      if (isAuthorComment && isAfterBaseline) {
        result.push({
          ...item,
          threadItems: childItems.length ? childItems : undefined,
        });
      } else if (childItems.length) {
        result.push(...childItems);
      }
    }

    return result;
  }

  private findOldestTimestamp(comments: IComment[]): number | null {
    let oldest: number | null = null;

    for (const comment of comments) {
      const timestamp = comment.publishedAt.getTime();

      if (oldest === null || timestamp < oldest) {
        oldest = timestamp;
      }

      if (comment.threadItems?.length) {
        const nestedOldest = this.findOldestTimestamp(comment.threadItems);

        if (
          nestedOldest !== null &&
          (oldest === null || nestedOldest < oldest)
        ) {
          oldest = nestedOldest;
        }
      }
    }

    return oldest;
  }

  private mapComment(
    item: Objects.WallWallComment,
    defaults: { ownerId: number; postId: number },
  ): IComment {
    const ownerId = item.owner_id ?? defaults.ownerId;
    const postId = item.post_id ?? defaults.postId;
    const threadDefaults = { ownerId, postId };

    type ThreadType = { items?: Objects.WallWallComment[]; count?: number };
    const thread = item.thread as ThreadType | undefined;
    const threadItems = thread?.items
      ? this.mapComments(thread.items, threadDefaults)
      : undefined;

    let threadCount: number | undefined = undefined;
    if (thread && typeof thread === 'object' && thread !== null) {
      const typedThread = thread as unknown as { count?: number };
      if ('count' in typedThread) {
        const countValue = typedThread.count;
        if (typeof countValue === 'number') {
          threadCount = countValue;
        }
      }
    }

    return {
      vkCommentId: item.id,
      ownerId,
      postId,
      fromId: item.from_id,
      text: item.text ?? '',
      publishedAt: new Date(item.date * 1000),
      likesCount: (() => {
        if (
          item.likes &&
          typeof item.likes === 'object' &&
          'count' in item.likes
        ) {
          const likesObj = item.likes as unknown as { count?: number };
          return typeof likesObj.count === 'number'
            ? likesObj.count
            : undefined;
        }
        return undefined;
      })(),
      parentsStack: item.parents_stack,
      threadCount: threadCount,
      threadItems:
        threadItems && threadItems.length > 0 ? threadItems : undefined,
      attachments: item.attachments,
      replyToUser: item.reply_to_user,
      replyToComment: item.reply_to_comment,
      isDeleted: Boolean(item.deleted),
    };
  }
}
