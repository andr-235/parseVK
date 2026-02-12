import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { VK } from 'vk-io';
import type { IPost } from '../interfaces/post.interfaces.js';
import {
  buildPostsCacheKey,
  CACHE_TTL,
} from '../../common/constants/cache-keys.js';
import { VkApiRequestManager } from './vk-api-request-manager.service.js';
import { VK_INSTANCE } from './vk-groups.service.js';

@Injectable()
export class VkPostsService {
  private readonly logger = new Logger(VkPostsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(VK_INSTANCE) private readonly vk: VK,
    private readonly requestManager: VkApiRequestManager,
  ) {}

  async getPosts(posts: Array<{ ownerId: number; postId: number }>) {
    if (!posts.length) {
      return { items: [], profiles: [], groups: [] };
    }

    const postIds = posts.map(({ ownerId, postId }) => `${ownerId}_${postId}`);

    return this.requestManager.execute(
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
  }

  async getGroupRecentPosts(options: {
    ownerId: number;
    count?: number;
    offset?: number;
  }): Promise<IPost[]> {
    const { ownerId, count = 10, offset = 0 } = options;
    const normalizedCount = Math.max(0, Math.min(count, 100));
    const cacheKey = buildPostsCacheKey(ownerId, offset, normalizedCount);

    const cached = await this.cacheManager.get<IPost[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${cacheKey}`);

    const response = await this.requestManager.execute(
      () =>
        this.vk.api.wall.get({
          owner_id: ownerId,
          count: normalizedCount,
          offset,
          filter: 'all',
        }),
      {
        method: 'wall.get',
        key: `wall:${ownerId}`,
      },
    );

    const normalizeBoolean = (value?: boolean | number | null): boolean => {
      if (typeof value === 'number') {
        return value === 1;
      }
      return Boolean(value);
    };

    const result = (response.items ?? []).map((item) => ({
      id: item.id,
      owner_id: item.owner_id,
      from_id: item.from_id,
      date: item.date,
      text: item.text ?? '',
      attachments: item.attachments,
      comments: {
        count: item.comments?.count ?? 0,
        can_post: (item.comments?.can_post ?? 0) as number,
        groups_can_post: normalizeBoolean(
          item.comments?.groups_can_post as boolean | number | null | undefined,
        ),
        can_close: normalizeBoolean(
          item.comments?.can_close as boolean | number | null | undefined,
        ),
        can_open: normalizeBoolean(
          item.comments?.can_open as boolean | number | null | undefined,
        ),
      },
    }));

    await this.cacheManager.set(cacheKey, result, CACHE_TTL.VK_POST * 1000);

    return result;
  }
}
