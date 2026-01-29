import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { APIError, VK } from 'vk-io';
import type { Objects, Params, Responses } from 'vk-io';
import type { IAuthor } from './interfaces/author.interfaces.js';
import type { IComment } from './interfaces/comment.interfaces.js';
import type { IPost } from './interfaces/post.interfaces.js';
import type { IGroup } from './interfaces/group.interfaces.js';
import {
  buildGroupCacheKey,
  buildUsersCacheKey,
  buildPostsCacheKey,
  buildCommentsCacheKey,
  CACHE_TTL,
} from '../common/constants/cache-keys.js';
import { VkApiRequestManager } from './services/vk-api-request-manager.service.js';
import { VkApiBatchingService } from './services/vk-api-batching.service.js';

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

export interface VkPhotoSize {
  type: string;
  url: string;
  width: number;
  height: number;
}

export interface VkPhoto {
  id: number;
  owner_id: number;
  photo_id: string;
  album_id: number;
  date: number;
  text?: string;
  sizes: VkPhotoSize[];
}

/**
 * Сервис для работы с VK API
 *
 * Обертка над библиотекой vk-io для взаимодействия с VK API.
 * Обеспечивает кэширование запросов и обработку ошибок.
 */
@Injectable()
export class VkService {
  private readonly vk: VK;
  private readonly logger = new Logger(VkService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly requestManager: VkApiRequestManager,
    private readonly batchingService: VkApiBatchingService,
  ) {
    const token = this.configService.get<string>('vkToken');
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

    // Запрос к VK API через request manager
    const response = await this.requestManager.execute(
      () =>
        this.vk.api.groups.getById({
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
        }),
      {
        method: 'groups.getById',
        key: `groups:${id}`,
      },
    );

    // Сохраняем в кэш
    await this.cacheManager.set(cacheKey, response, CACHE_TTL.VK_GROUP * 1000);

    return response;
  }

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
      'about',
      'activities',
      'bdate',
      'books',
      'career',
      'city',
      'connections',
      'contacts',
      'counters',
      'country',
      'domain',
      'education',
      'followers_count',
      'home_town',
      'interests',
      'last_seen',
      'maiden_name',
      'military',
      'movies',
      'music',
      'nickname',
      'occupation',
      'personal',
      'photo_50',
      'photo_100',
      'photo_200',
      'photo_200_orig',
      'photo_400_orig',
      'photo_id',
      'photo_max',
      'photo_max_orig',
      'relation',
      'relatives',
      'schools',
      'screen_name',
      'sex',
      'site',
      'status',
      'timezone',
      'tv',
      'universities',
    ];

    // Оптимизация: используем батчинг для запросов пользователей
    // VK API позволяет запрашивать до 1000 пользователей за раз
    // Но counters и military возвращаются только для одного пользователя
    // Поэтому сначала делаем batch запрос для всех, затем отдельные для counters/military
    const usersMap = new Map<number, Responses.UsersGetResponse[0]>();

    // Batch запрос для всех пользователей (до 1000 за раз)
    const batchResults = await this.batchingService.batch<
      number,
      Responses.UsersGetResponse[0]
    >(
      normalizedIds,
      async (batch) => {
        const result = await this.requestManager.execute(
          () =>
            this.vk.api.users.get({
              user_ids: batch.map(String),
              fields: fields.filter(
                (f) => f !== 'counters' && f !== 'military',
              ) as Params.UsersGetParams['fields'],
            }),
          {
            method: 'users.get',
            key: 'users:get',
          },
        );
        return result;
      },
      { maxBatchSize: 1000 },
    );

    // Сохраняем результаты в map
    for (const user of batchResults) {
      usersMap.set(user.id, user);
    }

    // Для counters и military делаем отдельные запросы (только если нужно)
    // Но для оптимизации пропускаем, так как это требует много запросов
    // Если нужны эти поля, можно добавить опциональный параметр

    const users = Array.from(usersMap.values());

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
      deactivated: user.deactivated ?? undefined,
      is_closed: normalizeBoolean(user.is_closed),
      can_access_closed: normalizeBoolean(user.can_access_closed),
      domain: user.domain ?? undefined,
      screen_name: user.screen_name ?? undefined,
      photo_50: user.photo_50 ?? undefined,
      photo_100: user.photo_100 ?? undefined,
      photo_200: user.photo_200 ?? undefined,
      photo_200_orig: user.photo_200_orig ?? undefined,
      photo_400_orig: user.photo_400_orig ?? undefined,
      photo_max: user.photo_max ?? undefined,
      photo_max_orig: user.photo_max_orig ?? undefined,
      photo_id: user.photo_id ?? undefined,
      city: user.city ?? undefined,
      country: user.country ?? undefined,
      about: user.about ?? undefined,
      activities: user.activities ?? undefined,
      bdate: user.bdate ?? undefined,
      books: user.books ?? undefined,
      career: user.career as IAuthor['career'] | undefined,
      connections: user.connections as IAuthor['connections'] | undefined,
      contacts: user.contacts as IAuthor['contacts'] | undefined,
      counters: user.counters as IAuthor['counters'] | undefined,
      education: user.education as IAuthor['education'] | undefined,
      followers_count:
        typeof user.followers_count === 'number'
          ? user.followers_count
          : undefined,
      home_town: user.home_town ?? undefined,
      interests: user.interests ?? undefined,
      last_seen: user.last_seen ?? undefined,
      maiden_name: user.maiden_name ?? undefined,
      military: user.military ?? undefined,
      movies: user.movies ?? undefined,
      music: user.music ?? undefined,
      nickname: user.nickname ?? undefined,
      occupation: user.occupation ?? undefined,
      personal: user.personal ?? undefined,
      relatives: user.relatives ?? undefined,
      relation: typeof user.relation === 'number' ? user.relation : undefined,
      schools: user.schools ?? undefined,
      sex: typeof user.sex === 'number' ? user.sex : undefined,
      site: user.site ?? undefined,
      status: user.status ?? undefined,
      timezone: typeof user.timezone === 'number' ? user.timezone : undefined,
      tv: user.tv ?? undefined,
      universities: user.universities ?? undefined,
    }));

    // Сохраняем в кэш
    await this.cacheManager.set(cacheKey, result, CACHE_TTL.VK_USER * 1000);

    return result;
  }

  async getUserPhotos(options: {
    userId: number;
    count?: number;
    offset?: number;
  }): Promise<VkPhoto[]> {
    const { userId, count = 100, offset = 0 } = options;

    try {
      const response = await this.requestManager.execute(
        () =>
          this.vk.api.photos.getAll({
            owner_id: userId,
            count: Math.min(Math.max(count, 1), 200),
            offset,
            extended: 0,
            photo_sizes: 1,
          }),
        {
          method: 'photos.getAll',
          key: `photos:${userId}`,
        },
      );

      const items = response.items ?? [];

      return items.map((photo) => ({
        id: photo.id,
        owner_id: photo.owner_id,
        photo_id: `${photo.owner_id}_${photo.id}`,
        album_id: photo.album_id,
        date: photo.date,
        text: photo.text ?? undefined,
        sizes: (photo.sizes ?? []).map((size) => {
          const typedSize = size as unknown as {
            type: string;
            url: string;
            width?: number;
            height?: number;
          };
          return {
            type: typedSize.type,
            url: typedSize.url,
            width: typedSize.width ?? 0,
            height: typedSize.height ?? 0,
          };
        }),
      }));
    } catch (error) {
      if (error instanceof APIError) {
        this.logger.error(
          `VK API error fetching photos for user ${userId}: ${error.message}`,
        );
      }
      throw error;
    }
  }

  getMaxPhotoSize(sizes: VkPhoto['sizes']): string | null {
    if (!sizes?.length) {
      return null;
    }

    const priority = ['w', 'z', 'y', 'x', 'm', 's'];

    for (const type of priority) {
      const size = sizes.find(
        (item) => item.type === type && Boolean(item.url),
      );
      if (size?.url) {
        return size.url;
      }
    }

    return sizes[0]?.url ?? null;
  }

  /**
   * Простая проверка доступности VK API
   * Используется для health check
   */
  async checkApiHealth(): Promise<void> {
    await this.requestManager.execute(
      () =>
        this.vk.api.groups.getById({
          group_ids: ['1'],
        }),
      {
        method: 'groups.getById',
        key: 'health:check',
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

    // Проверяем кэш
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

    // Сохраняем в кэш
    await this.cacheManager.set(cacheKey, result, CACHE_TTL.VK_POST * 1000);

    return result;
  }

  async searchGroupsByRegion({ query }: { query?: string }): Promise<IGroup[]> {
    this.logger.log(
      `Начат поиск групп в регионе "Еврейская автономная область"${
        query && query.trim().length > 0
          ? ` с фильтром "${query.trim()}"`
          : ' без фильтра'
      }`,
    );
    const regionTitle = 'Еврейская автономная область';
    const normalizedQuery = query?.trim() ?? '';
    const searchQuery = normalizedQuery.length > 0 ? normalizedQuery : ' ';

    try {
      const regionsResponse = await this.requestManager.execute(
        () =>
          this.vk.api.database.getRegions({
            country_id: 1,
            q: regionTitle,
            need_all: 1,
            count: 1000,
          }),
        {
          method: 'database.getRegions',
          key: 'database:regions',
        },
      );

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
          const response = await this.requestManager.execute(
            () =>
              this.vk.api.groups.search({
                q: searchQuery,
                country_id: 1,
                city_id: cityId,
                count: pageSize,
                offset,
              }),
            {
              method: 'groups.search',
              key: `groups:search:${cityId}`,
            },
          );

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

      if (uniqueGroups.size === 0) {
        return [];
      }

      const enrichedGroups = await this.enrichGroupsWithDetails(uniqueGroups);

      return enrichedGroups;
    } catch (error) {
      if (error instanceof APIError) {
        this.logger.error(
          `VK API error during regional group search: ${error.message}`,
        );
      } else if (
        error instanceof Error &&
        error.message === 'REGION_NOT_FOUND'
      ) {
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

  private async enrichGroupsWithDetails(
    groups: Map<number, IGroup>,
  ): Promise<IGroup[]> {
    const ids = Array.from(groups.keys());
    if (!ids.length) {
      return [];
    }

    const chunkSize = 400;
    const fields: Params.GroupsGetByIdParams['fields'] = [
      'members_count',
      'city',
      'activity',
      'status',
      'verified',
      'description',
      'addresses',
      'contacts',
      'site',
    ];

    const enriched = new Map<number, IGroup>(groups);

    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      try {
        const detailsResponse = await this.requestManager.execute(
          () =>
            this.vk.api.groups.getById({
              group_ids: chunk.map(String),
              fields,
            }),
          {
            method: 'groups.getById',
            key: 'groups:enrich',
          },
        );
        const detailsArray = Array.isArray(detailsResponse)
          ? detailsResponse
          : (detailsResponse.groups ?? []);
        const details = detailsArray as Objects.GroupsGroupFull[];

        details.forEach((detail) => {
          const base = enriched.get(detail.id);
          const merged: IGroup = {
            ...(base ?? {}),
            ...(detail as unknown as IGroup),
          };
          enriched.set(detail.id, merged);
        });
      } catch (error) {
        this.logger.error(
          `Не удалось загрузить подробности для групп: ${chunk.join(', ')}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return Array.from(enriched.values());
  }

  private async collectRegionCityIds(regionId: number): Promise<number[]> {
    const pageSize = 1000;
    const result: number[] = [];
    let offset = 0;

    while (true) {
      const response = await this.requestManager.execute(
        () =>
          this.vk.api.database.getCities({
            country_id: 1,
            region_id: regionId,
            need_all: 1,
            count: pageSize,
            offset,
          }),
        {
          method: 'database.getCities',
          key: `database:cities:${regionId}`,
        },
      );

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

  private resolveApiTimeout(): number {
    const fallback = 30_000; // VK API часто отвечает дольше стандартных 10 секунд.
    const timeout = this.configService.get<number>('vkApiTimeoutMs');
    return timeout ?? fallback;
  }

  private applyApiTimeout(vk: VK, timeout: number): void {
    if (vk.api?.options) {
      vk.api.options.apiTimeout = timeout;
    }
  }
}
