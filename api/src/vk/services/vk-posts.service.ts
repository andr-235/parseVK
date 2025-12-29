/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { VK } from 'vk-io';
import type { IPost } from '../interfaces/post.interfaces';
import { VkCacheService } from './vk-cache.service';
import { VkApiRequestManager } from './vk-api-request-manager.service';
import { normalizePost } from '../utils/vk-normalization.utils';
import { VK_API_CONSTANTS } from '../constants/vk-service.constants';
import {
  buildPostsCacheKey,
  CACHE_TTL,
} from '../../common/constants/cache-keys';

/**
 * Сервис для работы с постами VK API
 */
@Injectable()
export class VkPostsService {
  private readonly logger = new Logger(VkPostsService.name);

  constructor(
    private readonly vk: VK,
    private readonly cacheService: VkCacheService,
    private readonly requestManager: VkApiRequestManager,
  ) {}

  /**
   * Получает посты по их ID
   */
  async getPosts(posts: Array<{ ownerId: number; postId: number }>): Promise<{
    items: any[];
    profiles: any[];
    groups: any[];
  }> {
    if (!posts.length) {
      return { items: [], profiles: [], groups: [] };
    }

    const postIds = posts.map(({ ownerId, postId }) => `${ownerId}_${postId}`);

    const response = await this.requestManager.execute(
      () =>
        this.vk.api.wall.getById({
          posts: postIds,
          extended: 1,
        }),
      {
        method: 'wall.getById',
        key: 'wall:getById',
      },
    );

    return {
      items: response.items ?? [],
      profiles: response.profiles ?? [],
      groups: response.groups ?? [],
    };
  }

  /**
   * Получает последние посты группы
   */
  async getGroupRecentPosts(options: {
    ownerId: number;
    count?: number;
    offset?: number;
  }): Promise<IPost[]> {
    const { ownerId, count = 10, offset = 0 } = options;
    const normalizedCount = Math.max(
      0,
      Math.min(count, VK_API_CONSTANTS.POSTS_MAX_COUNT),
    );
    const cacheKey = buildPostsCacheKey(ownerId, offset, normalizedCount);

    return this.cacheService.cachedRequest(cacheKey, CACHE_TTL.VK_POST, () =>
      this.fetchGroupPosts(ownerId, normalizedCount, offset),
    );
  }

  /**
   * Выполняет запрос постов группы из VK API
   */
  private async fetchGroupPosts(
    ownerId: number,
    count: number,
    offset: number,
  ): Promise<IPost[]> {
    const response = await this.requestManager.execute(
      () =>
        this.vk.api.wall.get({
          owner_id: ownerId,
          count,
          offset,
          filter: 'all',
        }),
      {
        method: 'wall.get',
        key: `wall:${ownerId}`,
      },
    );

    return (response.items ?? []).map(normalizePost);
  }
}
