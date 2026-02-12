import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { APIError, VK } from 'vk-io';
import type { Params, Responses } from 'vk-io';
import type { IAuthor } from '../interfaces/author.interfaces.js';
import {
  buildUsersCacheKey,
  CACHE_TTL,
} from '../../common/constants/cache-keys.js';
import { VkApiRequestManager } from './vk-api-request-manager.service.js';
import { VkApiBatchingService } from './vk-api-batching.service.js';
import { VK_INSTANCE } from './vk-groups.service.js';
import type {
  VkPhoto,
  VkPhotoSize,
} from '../interfaces/vk-service.interfaces.js';

@Injectable()
export class VkUsersService {
  private readonly logger = new Logger(VkUsersService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(VK_INSTANCE) private readonly vk: VK,
    private readonly requestManager: VkApiRequestManager,
    private readonly batchingService: VkApiBatchingService,
  ) {}

  async getAuthors(userIds: Array<string | number>): Promise<IAuthor[]> {
    if (!userIds.length) {
      return [];
    }

    const normalizedIds = userIds.map((id) =>
      typeof id === 'number' ? id : Number.parseInt(String(id), 10),
    );
    const cacheKey = buildUsersCacheKey(normalizedIds);

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

    const usersMap = new Map<number, Responses.UsersGetResponse[0]>();

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

    for (const user of batchResults) {
      usersMap.set(user.id, user);
    }

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

  getMaxPhotoSize(sizes: VkPhotoSize[]): string | null {
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
}
