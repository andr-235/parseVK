import { vi } from 'vitest';
import { VK } from 'vk-io';
import { VkGroupsService } from './vk-groups.service.js';
import type { Cache } from 'cache-manager';
import type { VkApiRequestManager } from './vk-api-request-manager.service.js';

vi.mock('vk-io', () => ({ VK: vi.fn() }));

function createMockVkApi() {
  return {
    groups: { getById: vi.fn(), search: vi.fn() },
    database: { getRegions: vi.fn(), getCities: vi.fn() },
  };
}

function createService() {
  const cacheManager = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  } as unknown as Cache;

  const api = createMockVkApi();
  const vkInstance = { api } as unknown as VK;

  const requestManager = {
    execute: vi.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  } as unknown as VkApiRequestManager;

  const service = new VkGroupsService(cacheManager, vkInstance, requestManager);

  return { service, api, cacheManager, requestManager };
}

describe('VkGroupsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGroups', () => {
    it('возвращает данные из кэша при попадании', async () => {
      const { service, cacheManager, requestManager } = createService();
      const cached = { groups: [{ id: 1 }], profiles: [] };
      vi.mocked(cacheManager.get).mockResolvedValue(cached);

      const result = await service.getGroups(1);

      expect(result).toBe(cached);
      expect(requestManager.execute).not.toHaveBeenCalled();
    });

    it('запрашивает VK API и кэширует при промахе', async () => {
      const { service, api, cacheManager } = createService();
      const response = { groups: [{ id: 1 }], profiles: [] };
      api.groups.getById.mockResolvedValue(response);

      const result = await service.getGroups(123);

      expect(api.groups.getById).toHaveBeenCalledWith({
        group_ids: [123],
        fields: expect.arrayContaining(['members_count', 'wall']),
      });
      expect(cacheManager.set).toHaveBeenCalled();
      expect(result).toBe(response);
    });
  });

  describe('checkApiHealth', () => {
    it('выполняет запрос к groups.getById с id=1', async () => {
      const { service, api } = createService();
      api.groups.getById.mockResolvedValue({ groups: [] });

      await service.checkApiHealth();

      expect(api.groups.getById).toHaveBeenCalledWith({ group_ids: ['1'] });
    });
  });

  describe('searchGroupsByRegion', () => {
    it('выбрасывает REGION_NOT_FOUND если регион не найден', async () => {
      const { service, api } = createService();
      api.database.getRegions.mockResolvedValue({ items: [] });

      await expect(service.searchGroupsByRegion({})).rejects.toThrow(
        'REGION_NOT_FOUND',
      );
    });

    it('возвращает пустой массив если нет городов', async () => {
      const { service, api } = createService();
      api.database.getRegions.mockResolvedValue({
        items: [{ id: 10, title: 'Еврейская автономная область' }],
      });
      api.database.getCities.mockResolvedValue({ items: [], count: 0 });

      const result = await service.searchGroupsByRegion({});

      expect(result).toEqual([]);
    });

    it('собирает группы по городам и обогащает данными', async () => {
      const { service, api } = createService();
      api.database.getRegions.mockResolvedValue({
        items: [{ id: 10, title: 'Еврейская автономная область' }],
      });
      api.database.getCities.mockResolvedValue({
        items: [{ id: 1 }, { id: 2 }],
        count: 2,
      });
      api.groups.search.mockResolvedValue({
        items: [{ id: 100 }, { id: 101 }],
        count: 2,
      });
      api.groups.getById.mockResolvedValue({
        groups: [
          { id: 100, members_count: 500 },
          { id: 101, members_count: 200 },
        ],
      });

      const result = await service.searchGroupsByRegion({ query: 'test' });

      expect(result.length).toBeGreaterThan(0);
      expect(api.groups.search).toHaveBeenCalled();
      expect(api.groups.getById).toHaveBeenCalled();
    });
  });
});
