import { vi } from 'vitest';
import { VK } from 'vk-io';
import { VkPostsService } from './vk-posts.service.js';
import type { Cache } from 'cache-manager';
import type { VkApiRequestManager } from './vk-api-request-manager.service.js';

vi.mock('vk-io', () => ({
  VK: vi.fn(),
}));

function createService() {
  const cacheManager = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  } as unknown as Cache;

  const api = {
    wall: { getById: vi.fn(), get: vi.fn() },
  };
  const vkInstance = { api } as unknown as VK;

  const requestManager = {
    execute: vi.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  } as unknown as VkApiRequestManager;

  const service = new VkPostsService(cacheManager, vkInstance, requestManager);

  return { service, api, cacheManager, requestManager };
}

describe('VkPostsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPosts', () => {
    it('возвращает пустые массивы для пустого списка', async () => {
      const { service, api } = createService();
      const result = await service.getPosts([]);
      expect(api.wall.getById).not.toHaveBeenCalled();
      expect(result).toEqual({ items: [], profiles: [], groups: [] });
    });

    it('запрашивает wall.getById с правильными ключами', async () => {
      const { service, api } = createService();
      const response = { items: [{ id: 1 }], profiles: [], groups: [] };
      api.wall.getById.mockResolvedValue(response);

      const result = await service.getPosts([
        { ownerId: 1, postId: 2 },
        { ownerId: -3, postId: 4 },
      ]);

      expect(api.wall.getById).toHaveBeenCalledWith({
        posts: ['1_2', '-3_4'],
        extended: 1,
      });
      expect(result).toBe(response);
    });
  });

  describe('getGroupRecentPosts', () => {
    it('нормализует поля comments и булевы флаги', async () => {
      const { service, api } = createService();
      api.wall.get.mockResolvedValue({
        items: [
          {
            id: 11,
            owner_id: -1,
            from_id: 5,
            date: 1700000000,
            text: undefined,
            comments: {
              count: 3,
              can_post: 0,
              groups_can_post: 1,
              can_close: 0,
              can_open: true,
            },
          },
        ],
      });

      const result = await service.getGroupRecentPosts({
        ownerId: -1,
        count: 1,
      });

      expect(result).toEqual([
        {
          id: 11,
          owner_id: -1,
          from_id: 5,
          date: 1700000000,
          text: '',
          comments: {
            count: 3,
            can_post: 0,
            groups_can_post: true,
            can_close: false,
            can_open: true,
          },
        },
      ]);
    });

    it('использует кэш при повторном запросе', async () => {
      const { service, api, cacheManager } = createService();
      const cached = [{ id: 1, owner_id: -1, from_id: 1, date: 0, text: '' }];
      vi.mocked(cacheManager.get).mockResolvedValue(cached);

      const result = await service.getGroupRecentPosts({ ownerId: -1 });

      expect(api.wall.get).not.toHaveBeenCalled();
      expect(result).toBe(cached);
    });

    it('ограничивает count до 100', async () => {
      const { service, api } = createService();
      api.wall.get.mockResolvedValue({ items: [] });

      await service.getGroupRecentPosts({ ownerId: -1, count: 500 });

      expect(api.wall.get).toHaveBeenCalledWith(
        expect.objectContaining({ count: 100 }),
      );
    });
  });
});
