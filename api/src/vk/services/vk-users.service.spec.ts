import { vi } from 'vitest';
import { APIError, VK } from 'vk-io';
import { VkUsersService } from './vk-users.service.js';
import type { Cache } from 'cache-manager';
import type { VkApiRequestManager } from './vk-api-request-manager.service.js';
import type { VkApiBatchingService } from './vk-api-batching.service.js';

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
    users: { get: vi.fn() },
    photos: { getAll: vi.fn() },
  };
  const vkInstance = { api } as unknown as VK;

  const requestManager = {
    execute: vi.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  } as unknown as VkApiRequestManager;

  const batchingService = {
    batch: vi.fn(),
  } as unknown as VkApiBatchingService;

  const service = new VkUsersService(
    cacheManager,
    vkInstance,
    requestManager,
    batchingService,
  );

  return { service, api, cacheManager, requestManager, batchingService };
}

describe('VkUsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthors', () => {
    it('возвращает пустой массив при пустом списке id', async () => {
      const { service, batchingService } = createService();
      const result = await service.getAuthors([]);
      expect(result).toEqual([]);
      expect(batchingService.batch).not.toHaveBeenCalled();
    });

    it('нормализует булевы флаги и опциональные поля', async () => {
      const { service, batchingService } = createService();
      const userResponse = [
        {
          id: 1,
          first_name: 'Ivan',
          last_name: 'Ivanov',
          is_closed: 1,
          can_access_closed: 0,
          domain: null,
          screen_name: undefined,
          photo_50: 'photo50',
          photo_100: null,
          photo_200_orig: undefined,
          city: { id: 10, title: 'City' },
          country: null,
        },
      ];
      vi.mocked(batchingService.batch).mockResolvedValue(userResponse);

      const result = await service.getAuthors([1]);

      expect(result).toEqual([
        expect.objectContaining({
          id: 1,
          first_name: 'Ivan',
          last_name: 'Ivanov',
          is_closed: true,
          can_access_closed: false,
          domain: undefined,
          photo_50: 'photo50',
          photo_100: undefined,
          city: { id: 10, title: 'City' },
          country: undefined,
        }),
      ]);
    });

    it('возвращает из кэша при попадании', async () => {
      const { service, cacheManager, batchingService } = createService();
      const cached = [{ id: 1, first_name: 'Test', last_name: '' }];
      vi.mocked(cacheManager.get).mockResolvedValue(cached);

      const result = await service.getAuthors([1]);

      expect(result).toBe(cached);
      expect(batchingService.batch).not.toHaveBeenCalled();
    });
  });

  describe('getUserPhotos', () => {
    it('возвращает фото с правильной структурой', async () => {
      const { service, api } = createService();
      api.photos.getAll.mockResolvedValue({
        items: [
          {
            id: 100,
            owner_id: 1,
            album_id: -6,
            date: 1700000000,
            text: 'photo',
            sizes: [
              {
                type: 'x',
                url: 'http://example.com/x.jpg',
                width: 604,
                height: 453,
              },
              {
                type: 'z',
                url: 'http://example.com/z.jpg',
                width: 1280,
                height: 960,
              },
            ],
          },
        ],
      });

      const result = await service.getUserPhotos({ userId: 1 });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 100,
        owner_id: 1,
        photo_id: '1_100',
        album_id: -6,
        date: 1700000000,
        text: 'photo',
        sizes: [
          {
            type: 'x',
            url: 'http://example.com/x.jpg',
            width: 604,
            height: 453,
          },
          {
            type: 'z',
            url: 'http://example.com/z.jpg',
            width: 1280,
            height: 960,
          },
        ],
      });
    });

    it('пробрасывает APIError', async () => {
      const { service, requestManager } = createService();
      const error = new APIError({
        code: 30,
        message: 'Profile is private',
      } as never);
      requestManager.execute.mockRejectedValue(error);

      await expect(service.getUserPhotos({ userId: 999 })).rejects.toThrow();
    });
  });

  describe('getMaxPhotoSize', () => {
    it('возвращает null для пустого массива', () => {
      const { service } = createService();
      expect(service.getMaxPhotoSize([])).toBeNull();
    });

    it('выбирает размер по приоритету w > z > y > x', () => {
      const { service } = createService();
      const sizes = [
        { type: 'x', url: 'url_x', width: 604, height: 453 },
        { type: 'z', url: 'url_z', width: 1280, height: 960 },
      ];
      expect(service.getMaxPhotoSize(sizes)).toBe('url_z');
    });

    it('возвращает первый url если нет приоритетного размера', () => {
      const { service } = createService();
      const sizes = [{ type: 'a', url: 'url_a', width: 100, height: 100 }];
      expect(service.getMaxPhotoSize(sizes)).toBe('url_a');
    });
  });
});
