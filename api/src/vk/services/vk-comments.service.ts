import { Injectable, Logger } from '@nestjs/common';
import { VK } from 'vk-io';
import type { Objects } from 'vk-io';
import type { IComment } from '../interfaces/comment.interfaces';
import { VkCacheService } from './vk-cache.service';
import { VkApiRequestManager } from './vk-api-request-manager.service';
import {
  createAccessDeniedResponse,
  isAccessDeniedError,
} from '../utils/vk-error-handler.utils';
import { VK_API_CONSTANTS } from '../constants/vk-service.constants';
import {
  buildCommentsCacheKey,
  CACHE_TTL,
} from '../../common/constants/cache-keys';
import type { GetCommentsResponse } from '../vk.service';

/**
 * Сервис для работы с комментариями VK API
 */
@Injectable()
export class VkCommentsService {
  private readonly logger = new Logger(VkCommentsService.name);

  constructor(
    private readonly vk: VK,
    private readonly cacheService: VkCacheService,
    private readonly requestManager: VkApiRequestManager,
  ) {}

  /**
   * Получает комментарии поста
   */
  async getComments(options: {
    ownerId: number;
    postId: number;
    count?: number;
    offset?: number;
    sort?: 'asc' | 'desc';
    previewLength?: number;
    commentId?: number;
    startCommentId?: number;
    threadItemsCount?: number;
    needLikes?: boolean;
    extended?: boolean;
  }): Promise<{
    count: number;
    current_level_count: number;
    can_post: number;
    show_reply_button: number;
    groups_can_post: number;
    items: IComment[];
    profiles: any[];
    groups: any[];
  }> {
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
    } = options;

    // Кэшируем только базовые запросы без специфических параметров
    const isCacheable = !commentId && !startCommentId;
    const cacheKey = isCacheable
      ? buildCommentsCacheKey(ownerId, postId, offset)
      : null;

    // Проверяем кэш
    if (cacheKey) {
      const cached = await this.cacheService.get<GetCommentsResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.requestManager.execute(
        () =>
          this.vk.api.wall.getComments({
            owner_id: ownerId,
            post_id: postId,
            need_likes: needLikes ? 1 : 0,
            extended: extended ? 1 : 0,
            count: Math.max(
              0,
              Math.min(count, VK_API_CONSTANTS.COMMENTS_MAX_COUNT),
            ),
            offset,
            sort,
            preview_length: previewLength,
            comment_id: commentId,
            start_comment_id: startCommentId,
            thread_items_count: threadItemsCount,
          }),
        {
          method: 'wall.getComments',
          key: `comments:${ownerId}:${postId}`,
        },
      );

      const items = this.mapComments(response.items ?? [], { ownerId, postId });

      const result: GetCommentsResponse = {
        ...response,
        items,
        profiles: response.profiles ?? [],
        groups: response.groups ?? [],
        can_post:
          typeof response.can_post === 'boolean'
            ? response.can_post
              ? 1
              : 0
            : (response.can_post ?? 0),
        show_reply_button:
          typeof response.show_reply_button === 'boolean'
            ? response.show_reply_button
              ? 1
              : 0
            : (response.show_reply_button ?? 0),
        groups_can_post:
          typeof response.groups_can_post === 'boolean'
            ? response.groups_can_post
              ? 1
              : 0
            : (response.groups_can_post ?? 0),
      };

      // Сохраняем в кэш только базовые запросы
      if (cacheKey) {
        await this.cacheService.set(cacheKey, result, CACHE_TTL.VK_COMMENTS);
      }

      return result;
    } catch (error) {
      if (isAccessDeniedError(error)) {
        return createAccessDeniedResponse();
      }
      throw error;
    }
  }

  /**
   * Получает комментарии автора для поста
   */
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
      batchSize = VK_API_CONSTANTS.AUTHOR_COMMENTS_BATCH_SIZE,
      maxPages = VK_API_CONSTANTS.AUTHOR_COMMENTS_MAX_PAGES,
      threadItemsCount = VK_API_CONSTANTS.DEFAULT_THREAD_ITEMS_COUNT,
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

  /**
   * Маппит комментарии из VK API формата в внутренний
   */
  private mapComments(
    items: Objects.WallWallComment[],
    defaults: { ownerId: number; postId: number },
  ): IComment[] {
    return items.map((item) => this.mapComment(item, defaults));
  }

  /**
   * Маппит один комментарий
   */
  private mapComment(
    item: Objects.WallWallComment,
    defaults: { ownerId: number; postId: number },
  ): IComment {
    const ownerId = item.owner_id ?? defaults.ownerId;
    const postId = item.post_id ?? defaults.postId;
    const threadDefaults = { ownerId, postId };

    const thread = item.thread as
      | { items?: Objects.WallWallComment[]; count?: number }
      | undefined;
    const threadItems = thread?.items
      ? this.mapComments(thread.items, threadDefaults)
      : undefined;

    let threadCount: number | undefined = undefined;
    if (thread && typeof thread === 'object' && thread !== null) {
      const typedThread = thread as { count?: number };
      if ('count' in typedThread) {
        threadCount =
          typeof typedThread.count === 'number' ? typedThread.count : undefined;
      }
    }

    return {
      vkCommentId: item.id,
      ownerId,
      postId,
      fromId: item.from_id,
      text: item.text ?? '',
      publishedAt: new Date(item.date * 1000),
      likesCount: this.extractLikesCount(item.likes),
      parentsStack: item.parents_stack,
      threadCount,
      threadItems:
        threadItems && threadItems.length > 0 ? threadItems : undefined,
      attachments: item.attachments,
      replyToUser: item.reply_to_user,
      replyToComment: item.reply_to_comment,
      isDeleted: Boolean(item.deleted),
    };
  }

  /**
   * Извлекает количество лайков из комментария
   */
  private extractLikesCount(likes: any): number | undefined {
    if (likes && typeof likes === 'object' && 'count' in likes) {
      const likesObj = likes as { count?: number };
      return typeof likesObj.count === 'number' ? likesObj.count : undefined;
    }
    return undefined;
  }

  /**
   * Фильтрует комментарии по автору
   */
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

  /**
   * Находит самый старый timestamp в комментариях
   */
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
}
