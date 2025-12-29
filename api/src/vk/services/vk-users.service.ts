import { Injectable, Logger } from '@nestjs/common';
import { VK } from 'vk-io';
import type { Params, Responses } from 'vk-io';
import type { IAuthor } from '../interfaces/author.interfaces';
import { VkCacheService } from './vk-cache.service';
import { VkApiRequestManager } from './vk-api-request-manager.service';
import { VkApiBatchingService } from './vk-api-batching.service';
import { normalizeAuthor } from '../utils/vk-normalization.utils';
import {
  VK_USER_FIELDS,
  VK_API_CONSTANTS,
} from '../constants/vk-service.constants';
import {
  buildUsersCacheKey,
  CACHE_TTL,
} from '../../common/constants/cache-keys';

/**
 * Сервис для работы с пользователями VK API
 */
@Injectable()
export class VkUsersService {
  private readonly logger = new Logger(VkUsersService.name);

  constructor(
    private readonly vk: VK,
    private readonly cacheService: VkCacheService,
    private readonly requestManager: VkApiRequestManager,
    private readonly batchingService: VkApiBatchingService,
  ) {}

  /**
   * Получает информацию о пользователях
   */
  async getAuthors(userIds: Array<string | number>): Promise<IAuthor[]> {
    if (!userIds.length) {
      return [];
    }

    const normalizedIds = userIds.map((id) =>
      typeof id === 'number' ? id : Number.parseInt(String(id), 10),
    );

    const cacheKey = buildUsersCacheKey(normalizedIds);

    return this.cacheService.cachedRequest(cacheKey, CACHE_TTL.VK_USER, () =>
      this.fetchAuthors(normalizedIds),
    );
  }

  /**
   * Выполняет запрос пользователей из VK API
   */
  private async fetchAuthors(normalizedIds: number[]): Promise<IAuthor[]> {
    this.logger.debug(`Fetching ${normalizedIds.length} users from VK API`);

    // Оптимизация: используем батчинг для запросов пользователей
    const usersMap = new Map<number, Responses.UsersGetResponse[0]>();

    // Batch запрос для всех пользователей (до 1000 за раз)
    const batchResults = await this.batchingService.batch<
      number,
      Responses.UsersGetResponse[0]
    >(normalizedIds, async (batch) => this.fetchUsersBatch(batch), {
      maxBatchSize: VK_API_CONSTANTS.USERS_BATCH_SIZE,
    });

    // Сохраняем результаты в map
    for (const user of batchResults) {
      usersMap.set(user.id, user);
    }

    const users = Array.from(usersMap.values());
    return users.map(normalizeAuthor);
  }

  /**
   * Выполняет один батч запроса пользователей
   */
  private async fetchUsersBatch(
    batch: number[],
  ): Promise<Responses.UsersGetResponse[0][]> {
    const result = await this.requestManager.execute(
      () =>
        this.vk.api.users.get({
          user_ids: batch.map(String),
          fields: VK_USER_FIELDS.filter(
            (f) => f !== 'counters' && f !== 'military',
          ) as Params.UsersGetParams['fields'],
        }),
      {
        method: 'users.get',
        key: 'users:get',
      },
    );

    return result;
  }

  /**
   * Получает пользователей с дополнительными полями (counters, military)
   * Примечание: VK API возвращает counters и military только для одного пользователя
   */
  async getAuthorsWithExtendedFields(userIds: number[]): Promise<IAuthor[]> {
    if (!userIds.length) {
      return [];
    }

    if (userIds.length === 1) {
      return this.getSingleAuthorWithExtendedFields(userIds[0]);
    }

    // Для нескольких пользователей получаем базовую информацию
    this.logger.warn(
      'Requesting extended fields (counters, military) for multiple users. ' +
        'VK API returns these fields only for single user requests. ' +
        'Using basic fields for all users.',
    );

    return this.getAuthors(userIds);
  }

  /**
   * Получает одного пользователя с расширенными полями
   */
  private async getSingleAuthorWithExtendedFields(
    userId: number,
  ): Promise<IAuthor[]> {
    const result = await this.requestManager.execute(
      () =>
        this.vk.api.users.get({
          user_ids: [String(userId)],
          fields: VK_USER_FIELDS as Params.UsersGetParams['fields'],
        }),
      {
        method: 'users.get',
        key: `users:get:${userId}:extended`,
      },
    );

    return result.map(normalizeAuthor);
  }
}
