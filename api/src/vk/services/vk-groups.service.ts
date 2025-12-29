import { Injectable, Logger } from '@nestjs/common';
import { VK } from 'vk-io';
import type { Objects } from 'vk-io';
import type { IGroup } from '../interfaces/group.interfaces';
import { VkCacheService } from './vk-cache.service';
import { VkApiRequestManager } from './vk-api-request-manager.service';
import { VkApiBatchingService } from './vk-api-batching.service';
import { safeVkApiCall } from '../utils/vk-error-handler.utils';
import {
  VK_GROUP_FIELDS,
  VK_GROUP_SEARCH_FIELDS,
  VK_API_CONSTANTS,
} from '../constants/vk-service.constants';
import {
  buildGroupCacheKey,
  CACHE_TTL,
} from '../../common/constants/cache-keys';

/**
 * Сервис для работы с группами VK API
 */
@Injectable()
export class VkGroupsService {
  private readonly logger = new Logger(VkGroupsService.name);

  constructor(
    private readonly vk: VK,
    private readonly cacheService: VkCacheService,
    private readonly requestManager: VkApiRequestManager,
    private readonly batchingService: VkApiBatchingService,
  ) {}

  /**
   * Получает информацию о группе
   */
  async getGroup(
    id: string | number,
  ): Promise<{ groups: any[]; profiles: any[] } | null> {
    const cacheKey = buildGroupCacheKey(id);

    const result = await safeVkApiCall(
      () =>
        this.cacheService.cachedRequest(cacheKey, CACHE_TTL.VK_GROUP, () =>
          this.fetchGroup(id),
        ),
      `getGroup(${id})`,
      this.logger,
    );

    return result;
  }

  /**
   * Выполняет запрос группы из VK API
   */
  private async fetchGroup(
    id: string | number,
  ): Promise<{ groups: any[]; profiles: any[] }> {
    return this.requestManager.execute(
      () =>
        this.vk.api.groups.getById({
          group_ids: [id],
          fields: VK_GROUP_FIELDS,
        }),
      {
        method: 'groups.getById',
        key: `groups:${id}`,
      },
    );
  }

  /**
   * Получает детальную информацию о группах
   */
  async getGroupsDetails(groupIds: string[]): Promise<IGroup[]> {
    if (!groupIds.length) {
      return [];
    }

    const uniqueGroups = new Map<number, IGroup>();

    // Получаем группы батчами
    const batches = this.createBatches(
      groupIds,
      VK_API_CONSTANTS.GROUPS_BATCH_SIZE,
    );

    for (const batch of batches) {
      const details = await this.fetchGroupsBatch(batch);
      for (const detail of details) {
        uniqueGroups.set(detail.id, detail);
      }
    }

    return Array.from(uniqueGroups.values());
  }

  /**
   * Получает батч групп с деталями
   */
  private async fetchGroupsBatch(
    groupIds: string[],
  ): Promise<Objects.GroupsGroupFull[]> {
    const response = await this.requestManager.execute(
      () =>
        this.vk.api.groups.getById({
          group_ids: groupIds,
          fields: [...VK_GROUP_SEARCH_FIELDS],
        }),
      {
        method: 'groups.getById',
        key: 'groups:enrich',
      },
    );

    return Array.isArray(response) ? response : (response.groups ?? []);
  }

  /**
   * Ищет группы по региону
   */
  async searchGroupsByRegion(options: {
    query?: string;
    regionTitle?: string;
  }): Promise<IGroup[]> {
    const { query, regionTitle = VK_API_CONSTANTS.DEFAULT_SEARCH_REGION } =
      options;
    const normalizedQuery = query?.trim() ?? '';

    this.logger.log(
      `Начат поиск групп в регионе "${regionTitle}"${
        normalizedQuery && normalizedQuery.length > 0
          ? ` с фильтром "${normalizedQuery}"`
          : ' без фильтра'
      }`,
    );

    const region = await this.findRegion(regionTitle);
    if (!region) {
      this.logger.warn(`Регион "${regionTitle}" не найден в VK API`);
      return [];
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

    return this.searchGroupsInCities(cityIds, normalizedQuery);
  }

  /**
   * Находит регион по названию
   */
  private async findRegion(
    regionTitle: string,
  ): Promise<{ id: number; title: string } | null> {
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
    return region ? { id: region.id, title: region.title } : null;
  }

  /**
   * Собирает ID городов региона
   */
  private async collectRegionCityIds(regionId: number): Promise<number[]> {
    const result: number[] = [];
    let offset = 0;

    while (true) {
      const response = await this.requestManager.execute(
        () =>
          this.vk.api.database.getCities({
            country_id: 1,
            region_id: regionId,
            need_all: 1,
            count: VK_API_CONSTANTS.CITIES_PAGE_SIZE,
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
      if (offset >= total || items.length < VK_API_CONSTANTS.CITIES_PAGE_SIZE) {
        break;
      }
    }

    return result;
  }

  /**
   * Ищет группы в указанных городах
   */
  private async searchGroupsInCities(
    cityIds: number[],
    query: string,
  ): Promise<IGroup[]> {
    const uniqueGroups = new Map<number, IGroup>();
    const searchQuery = query.length > 0 ? query : ' ';

    for (const cityId of cityIds) {
      const cityGroups = await this.searchGroupsInCity(cityId, searchQuery);
      for (const group of cityGroups) {
        uniqueGroups.set(group.id, group);
      }
    }

    this.logger.log(
      `Поиск по региону завершён, найдено уникальных групп: ${uniqueGroups.size}`,
    );

    if (uniqueGroups.size === 0) {
      return [];
    }

    // Обогащаем группы детальной информацией
    const groupIds = Array.from(uniqueGroups.keys()).map(String);
    const enrichedGroups = await this.getGroupsDetails(groupIds);

    return enrichedGroups;
  }

  /**
   * Ищет группы в одном городе
   */
  private async searchGroupsInCity(
    cityId: number,
    query: string,
  ): Promise<IGroup[]> {
    const result: IGroup[] = [];
    let offset = 0;

    while (true) {
      const response = await this.requestManager.execute(
        () =>
          this.vk.api.groups.search({
            q: query,
            country_id: 1,
            city_id: cityId,
            count: VK_API_CONSTANTS.GROUPS_SEARCH_PAGE_SIZE,
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

      result.push(...items);
      offset += items.length;

      const total = response.count ?? 0;
      if (
        offset >= total ||
        items.length < VK_API_CONSTANTS.GROUPS_SEARCH_PAGE_SIZE
      ) {
        break;
      }
    }

    return result;
  }

  /**
   * Создает батчи из массива элементов
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}
