import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { APIError, VK } from 'vk-io';
import type { Objects, Params, Responses } from 'vk-io';
import type { IAuthor } from './interfaces/author.interfaces';
import type { IComment } from './interfaces/comment.interfaces';
import type { IPost } from './interfaces/post.interfaces';
import type { IGroup } from './interfaces/group.interfaces';
import {
  buildGroupCacheKey,
  buildUsersCacheKey,
  buildPostsCacheKey,
  buildCommentsCacheKey,
  CACHE_TTL,
} from '../common/constants/cache-keys';

export interface GetCommentsOptions {
  ownerId: number;
  postId: number;
  count?: number;
  offset?: number;
  sort?: Params.WallGetCommentsParams['sort'];
  previewLength?: number;
  commentId?: number;
  startCommentId?: number;
  threadItemsCount?: number;
  needLikes?: boolean;
  extended?: boolean;
  fields?: Params.WallGetCommentsParams['fields'];
}

export type GetCommentsResponse = Omit<
  Responses.WallGetCommentsExtendedResponse,
  'items'
> & {
  items: IComment[];
};

@Injectable()
export class VkService {
  private readonly vk: VK;
  private readonly logger = new Logger(VkService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    const token = process.env.VK_TOKEN;
    if (!token) {
      throw new Error('VK_TOKEN environment variable is required');
    }
    const apiTimeout = this.resolveApiTimeout();
    const vk = new VK({ token });
    this.applyApiTimeout(vk, apiTimeout);
    this.vk = vk;
  }

  async getGroups(
    id: string | number,
  ): Promise<{ groups: any[]; profiles: any[] }> {
    const cacheKey = buildGroupCacheKey(id);

    // Проверяем кэш
    const cached = await this.cacheManager.get<{
      groups: any[];
      profiles: any[];
    }>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${cacheKey}`);

    // Запрос к VK API
    const response = await this.vk.api.groups.getById({
      group_ids: [id],
      fields: [
        'description',
        'members_count',
        'counters',
        'activity',
        'age_limits',
        'status',
        'verified',
        'wall',
        'addresses',
        'city',
      ],
    });

    // Сохраняем в кэш
    await this.cacheManager.set(cacheKey, response, CACHE_TTL.VK_GROUP * 1000);

    return response;
  }

  async getPosts(posts: Array<{ ownerId: number; postId: number }>) {
    if (!posts.length) {
      return { items: [], profiles: [], groups: [] };
    }

    const postIds = posts.map(({ ownerId, postId }) => `${ownerId}_${postId}`);

    return this.vk.api.wall.getById({
      posts: postIds,
      extended: 1,
    });
  }

  async getAuthors(userIds: Array<string | number>): Promise<IAuthor[]> {
    if (!userIds.length) {
      return [];
    }

    const normalizedIds = userIds.map((id) =>
      typeof id === 'number' ? id : Number.parseInt(String(id), 10),
    );
    const cacheKey = buildUsersCacheKey(normalizedIds);

    // Проверяем кэш
    const cached = await this.cacheManager.get<IAuthor[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${cacheKey}`);

    const fields: Params.UsersGetParams['fields'] = [
      'photo_50',
      'photo_100',
      'photo_200_orig',
      'city',
      'country',
      'domain',
      'screen_name',
    ];

    const users = await this.vk.api.users.get({
      user_ids: userIds.map(String),
      fields,
    });

    const normalizeBoolean = (value?: boolean | number | null) => {
      if (typeof value === 'number') {
        return value === 1;
      }
      return value ?? undefined;
    };

    const result = users.map((user) => ({
      id: user.id,
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      is_closed: normalizeBoolean(user.is_closed),
      can_access_closed: normalizeBoolean(user.can_access_closed),
      domain: user.domain ?? undefined,
      screen_name: user.screen_name ?? undefined,
      photo_50: user.photo_50 ?? undefined,
      photo_100: user.photo_100 ?? undefined,
      photo_200_orig: user.photo_200_orig ?? undefined,
      city: user.city ?? undefined,
      country: user.country ?? undefined,
    }));

    // Сохраняем в кэш
    await this.cacheManager.set(cacheKey, result, CACHE_TTL.VK_USER * 1000);

    return result;
  }

  async getGroupRecentPosts(options: {
    ownerId: number;
    count?: number;
    offset?: number;
  }): Promise<IPost[]> {
    const { ownerId, count = 10, offset = 0 } = options;
    const normalizedCount = Math.max(0, Math.min(count, 100));
    const cacheKey = buildPostsCacheKey(ownerId, offset, normalizedCount);

    // Проверяем кэш
    const cached = await this.cacheManager.get<IPost[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${cacheKey}`);

    const response = await this.vk.api.wall.get({
      owner_id: ownerId,
      count: normalizedCount,
      offset,
      filter: 'all',
    });

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
      comments: {
        count: item.comments?.count ?? 0,
        can_post: item.comments?.can_post ?? 0,
        groups_can_post: normalizeBoolean(item.comments?.groups_can_post),
        can_close: normalizeBoolean(item.comments?.can_close),
        can_open: normalizeBoolean(item.comments?.can_open),
      },
    }));

    // Сохраняем в кэш
    await this.cacheManager.set(cacheKey, result, CACHE_TTL.VK_POST * 1000);

    return result;
  }

  async searchGroupsByRegion({
    query,
  }: {
    query?: string;
  }): Promise<IGroup[]> {
    this.logger.log(
      `Начат поиск групп в регионе "Еврейская автономная область"${
        query && query.trim().length > 0 ? ` с фильтром "${query.trim()}"` : ' без фильтра'
      }`,
    );
    const regionTitle = 'Еврейская автономная область';
    const normalizedQuery = query?.trim() ?? '';
    const searchQuery = normalizedQuery.length > 0 ? normalizedQuery : ' ';

    try {
      const regionsResponse = await this.vk.api.database.getRegions({
        country_id: 1,
        q: regionTitle,
        need_all: 1,
        count: 1000,
      });

      const region = regionsResponse.items?.find(
        (item) => item.title === regionTitle,
      );

      if (!region) {
        this.logger.warn(`Регион "${regionTitle}" не найден в VK API`);
        throw new Error('REGION_NOT_FOUND');
      }

      const cityIds = await this.collectRegionCityIds(region.id);
      this.logger.log(
        `Для региона "${regionTitle}" найдено ${cityIds.length} городов`,
      );

      if (!cityIds.length) {
        this.logger.warn(
          `Для региона "${regionTitle}" не найдены города в VK API`,
        );
        return [];
      }

      const uniqueGroups = new Map<number, IGroup>();
      const pageSize = 200;

      for (const cityId of cityIds) {
        let offset = 0;

        while (true) {
          const response = await this.vk.api.groups.search({
            q: searchQuery,
            country_id: 1,
            city_id: cityId,
            count: pageSize,
            offset,
          });

          const items = (response.items ?? []) as IGroup[];

          if (!items.length) {
            this.logger.debug(
              `Город ${cityId}: достигнут конец выдачи на смещении ${offset}`,
            );
            break;
          }

          for (const item of items) {
            uniqueGroups.set(item.id, item);
          }

          offset += items.length;

          const total = response.count ?? 0;
          if (offset >= total || items.length < pageSize) {
            break;
          }
        }
      }

      this.logger.log(
        `Поиск по региону завершён, найдено уникальных групп: ${uniqueGroups.size}`,
      );

      return Array.from(uniqueGroups.values());
    } catch (error) {
      if (error instanceof APIError) {
        this.logger.error(
          `VK API error during regional group search: ${error.message}`,
        );
      } else if (error instanceof Error && error.message === 'REGION_NOT_FOUND') {
        throw error;
      } else {
        this.logger.error(
          'Не удалось выполнить поиск групп по региону',
          error instanceof Error ? error.stack : String(error),
        );
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('UNKNOWN_VK_ERROR');
    }
  }

  private async collectRegionCityIds(regionId: number): Promise<number[]> {
    const pageSize = 1000;
    const result: number[] = [];
    let offset = 0;

    while (true) {
      const response = await this.vk.api.database.getCities({
        country_id: 1,
        region_id: regionId,
        need_all: 1,
        count: pageSize,
        offset,
      });

      const items = response.items ?? [];

      if (!items.length) {
        break;
      }

      for (const item of items) {
        if (typeof item.id === 'number') {
          result.push(item.id);
        }
      }

      offset += items.length;

      const total = response.count ?? 0;
      if (offset >= total || items.length < pageSize) {
        break;
      }
    }

    return result;
  }

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

    // Кэшируем только базовые запросы без специфических параметров
    const isCacheable = !commentId && !startCommentId && !fields;
    const cacheKey = isCacheable
      ? buildCommentsCacheKey(ownerId, postId, offset)
      : null;

    // Проверяем кэш
    if (cacheKey) {
      const cached = await this.cacheManager.get<GetCommentsResponse>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache HIT: ${cacheKey}`);
        return cached;
      }
      this.logger.debug(`Cache MISS: ${cacheKey}`);
    }

    try {
      const response = await this.vk.api.wall.getComments({
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
      });

      const items = this.mapComments(response.items ?? [], { ownerId, postId });

      const result = {
        ...response,
        items,
      };

      // Сохраняем в кэш только базовые запросы
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

    const threadItems = item.thread?.items
      ? this.mapComments(item.thread.items, threadDefaults)
      : undefined;

    return {
      vkCommentId: item.id,
      ownerId,
      postId,
      fromId: item.from_id,
      text: item.text ?? '',
      publishedAt: new Date(item.date * 1000),
      likesCount: item.likes?.count,
      parentsStack: item.parents_stack,
      threadCount: item.thread?.count,
      threadItems:
        threadItems && threadItems.length > 0 ? threadItems : undefined,
      attachments: item.attachments,
      replyToUser: item.reply_to_user,
      replyToComment: item.reply_to_comment,
      isDeleted: Boolean(item.deleted),
    };
  }

  private resolveApiTimeout(): number {
    const fallback = 60_000; // VK API часто отвечает дольше стандартных 10 секунд.
    return parsePositiveInteger(process.env.VK_API_TIMEOUT_MS, fallback);
  }

  private applyApiTimeout(vk: VK, timeout: number): void {
    if (vk.api?.options) {
      vk.api.options.apiTimeout = timeout;
    }
  }
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}
