import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { APIError, VK } from 'vk-io';
import type { Objects, Params } from 'vk-io';
import type {
  IGroup,
  IGroupsResponse,
} from '../interfaces/group.interfaces.js';
import {
  buildGroupCacheKey,
  CACHE_TTL,
} from '../../common/constants/cache-keys.js';
import { VkApiRequestManager } from './vk-api-request-manager.service.js';

export const VK_INSTANCE = 'VK_INSTANCE';

@Injectable()
export class VkGroupsService {
  private readonly logger = new Logger(VkGroupsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(VK_INSTANCE) private readonly vk: VK,
    private readonly requestManager: VkApiRequestManager,
  ) {}

  async getGroups(id: string | number): Promise<IGroupsResponse> {
    const cacheKey = buildGroupCacheKey(id);

    const cached = await this.cacheManager.get<IGroupsResponse>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${cacheKey}`);

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

    await this.cacheManager.set(cacheKey, response, CACHE_TTL.VK_GROUP * 1000);

    return response;
  }

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

      return await this.enrichGroupsWithDetails(uniqueGroups);
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
}
