import { vi } from 'vitest';
import { APIError, VK } from 'vk-io';
import { VkCommentsService } from './vk-comments.service.js';
import type { Cache } from 'cache-manager';
import type { VkApiRequestManager } from './vk-api-request-manager.service.js';

vi.mock('vk-io', () => {
  class APIErrorMock extends Error {
    code: number;
    constructor({ code, message }: { code: number; message?: string }) {
      super(message ?? `API error ${code}`);
      this.code = code;
    }
  }
  return { VK: vi.fn(), APIError: APIErrorMock };
});

function createService() {
  const cacheManager = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  } as unknown as Cache;

  const api = {
    wall: { getComments: vi.fn() },
  };
  const vkInstance = { api } as unknown as VK;

  const requestManager = {
    execute: vi.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  } as unknown as VkApiRequestManager;

  const service = new VkCommentsService(
    cacheManager,
    vkInstance,
    requestManager,
  );

  return { service, api, cacheManager, requestManager };
}

describe('VkCommentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getComments', () => {
    it('преобразует вложенные треды и даты', async () => {
      const { service, api } = createService();
      api.wall.getComments.mockResolvedValue({
        count: 1,
        current_level_count: 1,
        can_post: 1,
        show_reply_button: 1,
        groups_can_post: 1,
        profiles: [],
        groups: [],
        items: [
          {
            id: 101,
            owner_id: -100,
            post_id: 55,
            from_id: 20,
            text: 'Parent',
            date: 1700000100,
            likes: { count: 5 },
            parents_stack: [],
            thread: {
              count: 1,
              items: [
                {
                  id: 102,
                  from_id: 21,
                  date: 1700000200,
                  text: 'Child',
                  likes: { count: 2 },
                  parents_stack: [101],
                  thread: {
                    count: 1,
                    items: [
                      {
                        id: 103,
                        from_id: 22,
                        date: 1700000300,
                        text: 'Nested',
                        likes: { count: 1 },
                        parents_stack: [101, 102],
                        thread: { count: 0, items: [] },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });

      const response = await service.getComments({ ownerId: -100, postId: 55 });

      expect(response.items).toHaveLength(1);
      const [parent] = response.items;
      expect(parent.threadItems).toHaveLength(1);
      const [child] = parent.threadItems ?? [];
      expect(child.threadItems).toHaveLength(1);
      const [nested] = child.threadItems ?? [];

      expect(parent.publishedAt.toISOString()).toBe('2023-11-14T22:15:00.000Z');
      expect(child.publishedAt.toISOString()).toBe('2023-11-14T22:16:40.000Z');
      expect(nested.publishedAt.toISOString()).toBe('2023-11-14T22:18:20.000Z');

      expect(parent.ownerId).toBe(-100);
      expect(parent.postId).toBe(55);
      expect(child.ownerId).toBe(-100);
      expect(nested.ownerId).toBe(-100);
      expect(nested.threadItems).toBeUndefined();
    });

    it('возвращает пустой ответ при APIError с кодом 15', async () => {
      const { service, requestManager } = createService();
      const apiError = new APIError({
        code: 15,
        message: 'Access denied',
      } as never);
      requestManager.execute.mockRejectedValue(apiError);

      await expect(
        service.getComments({ ownerId: -100, postId: 55 }),
      ).resolves.toEqual({
        count: 0,
        current_level_count: 0,
        can_post: 0,
        show_reply_button: 0,
        groups_can_post: 0,
        items: [],
        profiles: [],
        groups: [],
      });
    });

    it('пробрасывает ошибки с кодом != 15', async () => {
      const { service, requestManager } = createService();
      const err = new Error('Other error');
      requestManager.execute.mockRejectedValue(err);

      await expect(
        service.getComments({ ownerId: -100, postId: 55 }),
      ).rejects.toThrow('Other error');
    });
  });

  describe('getAuthorCommentsForPost', () => {
    it('возвращает только комментарии нужного автора с вложенностью', async () => {
      const { service, api } = createService();
      api.wall.getComments.mockResolvedValue({
        count: 50,
        current_level_count: 2,
        can_post: 0,
        show_reply_button: 0,
        groups_can_post: 0,
        items: [
          {
            id: 10,
            owner_id: 1,
            post_id: 2,
            from_id: 123,
            date: 1_700_000_500,
            text: 'parent',
            thread: {
              count: 2,
              items: [
                {
                  id: 11,
                  owner_id: 1,
                  post_id: 2,
                  from_id: 999,
                  date: 1_700_000_600,
                  text: 'other child',
                },
                {
                  id: 12,
                  owner_id: 1,
                  post_id: 2,
                  from_id: 123,
                  date: 1_700_000_700,
                  text: 'child',
                },
              ],
            },
          },
          {
            id: 13,
            owner_id: 1,
            post_id: 2,
            from_id: 456,
            date: 1_700_000_800,
            text: 'other',
          },
        ],
        profiles: [],
        groups: [],
      });

      const result = await service.getAuthorCommentsForPost({
        ownerId: 1,
        postId: 2,
        authorVkId: 123,
        batchSize: 10,
        maxPages: 1,
        threadItemsCount: 5,
      });

      expect(result).toHaveLength(1);
      expect(result[0].fromId).toBe(123);
      expect(result[0].threadItems).toHaveLength(1);
      expect(result[0].threadItems?.[0].fromId).toBe(123);
    });

    it('останавливает пагинацию при достижении baseline', async () => {
      const { service, api } = createService();
      api.wall.getComments.mockResolvedValue({
        count: 200,
        current_level_count: 2,
        can_post: 0,
        show_reply_button: 0,
        groups_can_post: 0,
        items: [
          {
            id: 21,
            owner_id: 1,
            post_id: 2,
            from_id: 123,
            date: 1_700_000_100,
            text: 'recent',
          },
          {
            id: 22,
            owner_id: 1,
            post_id: 2,
            from_id: 789,
            date: 1_700_000_050,
            text: 'older',
          },
        ],
        profiles: [],
        groups: [],
      });

      const result = await service.getAuthorCommentsForPost({
        ownerId: 1,
        postId: 2,
        authorVkId: 123,
        baseline: new Date(1_700_000_100 * 1000),
        batchSize: 20,
        maxPages: 3,
      });

      expect(api.wall.getComments).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });
});
