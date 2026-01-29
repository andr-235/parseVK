import { vi } from 'vitest';
import { APIError, VK } from 'vk-io';
import { VkService } from './vk.service.js';
import type { Cache } from 'cache-manager';

type ApiMock = {
  users: { get: ReturnType<typeof vi.fn> };
  wall: {
    get: ReturnType<typeof vi.fn>;
    getComments: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  groups: { getById: ReturnType<typeof vi.fn> };
};

vi.mock('vk-io', () => {
  const createApiMock = () => ({
    users: { get: vi.fn() },
    wall: { get: vi.fn(), getComments: vi.fn(), getById: vi.fn() },
    groups: { getById: vi.fn() },
  });

  const VKMock = vi.fn().mockImplementation(() => ({
    api: createApiMock(),
  }));

  class APIErrorMock extends Error {
    code: number;

    constructor({ code, message }: { code: number; message?: string }) {
      super(message ?? `API error ${code}`);
      this.code = code;
    }
  }

  return { VK: VKMock, APIError: APIErrorMock };
});

const getLastVkInstance = () => {
  const mock = VK as unknown as ReturnType<typeof vi.fn>;
  const lastCall = mock.mock.results[mock.mock.results.length - 1];
  if (!lastCall || lastCall.type !== 'return') {
    throw new Error('VK mock was not instantiated');
  }
  return lastCall.value as { api: ApiMock };
};

describe('VkService', () => {
  let mockCacheManager: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VK_TOKEN = 'test-token';

    // Mock cache manager
    mockCacheManager = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    delete process.env.VK_TOKEN;
  });

  const createService = () => {
    const configServiceMock = {
      get: vi.fn((key: string) => {
        if (key === 'vkToken') {
          return process.env.VK_TOKEN;
        }
        return undefined;
      }),
    } as unknown as { get: ReturnType<typeof vi.fn> };

    const requestManagerMock = {
      execute: vi.fn(),
    };

    const batchingServiceMock = {
      batch: vi.fn(),
    };

    const service = new VkService(
      mockCacheManager as unknown as Cache,
      configServiceMock as never,
      requestManagerMock as never,
      batchingServiceMock as never,
    );

    const { api } = getLastVkInstance();
    return {
      service,
      api,
      cacheManager: mockCacheManager as unknown as Cache,
      requestManager: requestManagerMock,
      batchingService: batchingServiceMock,
    };
  };

  describe('getGroups', () => {
    it('передает идентификаторы и поля и возвращает ответ без изменений', async () => {
      const { service, api, requestManager } = createService();

      const responseMock = { groups: [{ id: 1 }], profiles: [] };
      api.groups.getById.mockResolvedValue(responseMock);
      requestManager.execute.mockImplementation(
        (fn: () => Promise<unknown>) => {
          return Promise.resolve(fn());
        },
      );

      const result = await service.getGroups(123);

      expect(requestManager.execute).toHaveBeenCalled();
      expect(api.groups.getById).toHaveBeenCalledWith({
        group_ids: [123],
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
      expect(result).toBe(responseMock);
    });
  });

  describe('getPosts', () => {
    it('возвращает пустые массивы для пустого списка постов', async () => {
      const { service, api } = createService();

      const result = await service.getPosts([]);

      expect(api.wall.getById).not.toHaveBeenCalled();
      expect(result).toEqual({ items: [], profiles: [], groups: [] });
    });

    it('запрашивает wall.getById с корректными идентификаторами и возвращает ответ', async () => {
      const { service, api, requestManager } = createService();

      const responseMock = {
        items: [{ id: 1 }],
        profiles: [{ id: 2 }],
        groups: [{ id: 3 }],
      };
      api.wall.getById.mockResolvedValue(responseMock);
      requestManager.execute.mockImplementation(
        (fn: () => Promise<unknown>) => {
          return Promise.resolve(fn());
        },
      );

      const posts = [
        { ownerId: 1, postId: 2 },
        { ownerId: -3, postId: 4 },
      ];

      const result = await service.getPosts(posts);

      expect(requestManager.execute).toHaveBeenCalled();
      expect(api.wall.getById).toHaveBeenCalledWith({
        posts: ['1_2', '-3_4'],
        extended: 1,
      });
      expect(result).toBe(responseMock);
    });
  });

  describe('getAuthors', () => {
    it('нормализует булевы флаги и опциональные поля', async () => {
      const { service, api, requestManager, batchingService } = createService();

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

      api.users.get.mockResolvedValue(userResponse);
      requestManager.execute.mockResolvedValue(userResponse);
      batchingService.batch.mockResolvedValue(userResponse);

      const result = await service.getAuthors([1]);

      expect(result).toEqual([
        {
          id: 1,
          first_name: 'Ivan',
          last_name: 'Ivanov',
          deactivated: undefined,
          is_closed: true,
          can_access_closed: false,
          domain: undefined,
          screen_name: undefined,
          photo_50: 'photo50',
          photo_100: undefined,
          photo_200: undefined,
          photo_200_orig: undefined,
          photo_400_orig: undefined,
          photo_max: undefined,
          photo_max_orig: undefined,
          photo_id: undefined,
          city: { id: 10, title: 'City' },
          country: undefined,
          about: undefined,
          activities: undefined,
          bdate: undefined,
          books: undefined,
          career: undefined,
          connections: undefined,
          contacts: undefined,
          counters: undefined,
          education: undefined,
          followers_count: undefined,
          home_town: undefined,
          interests: undefined,
          last_seen: undefined,
          maiden_name: undefined,
          military: undefined,
          movies: undefined,
          music: undefined,
          nickname: undefined,
          occupation: undefined,
          personal: undefined,
          relatives: undefined,
          relation: undefined,
          schools: undefined,
          sex: undefined,
          site: undefined,
          status: undefined,
          timezone: undefined,
          tv: undefined,
          universities: undefined,
        },
      ]);
    });
  });

  describe('getGroupRecentPosts', () => {
    it('нормализует поля comments и булевы флаги', async () => {
      const { service, api, requestManager } = createService();

      const responseMock = {
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
      };

      api.wall.get.mockResolvedValue(responseMock);
      requestManager.execute.mockImplementation(
        (fn: () => Promise<unknown>) => {
          return Promise.resolve(fn());
        },
      );

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
  });

  describe('getAuthorCommentsForPost', () => {
    it('возвращает только комментарии указанного автора и сохраняет вложенность', async () => {
      const { service, api, requestManager } = createService();

      const responseMock = {
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
      };

      api.wall.getComments.mockResolvedValue(responseMock);
      requestManager.execute.mockImplementation(
        (fn: () => Promise<unknown>) => {
          return Promise.resolve(fn());
        },
      );

      const result = await service.getAuthorCommentsForPost({
        ownerId: 1,
        postId: 2,
        authorVkId: 123,
        batchSize: 10,
        maxPages: 1,
        threadItemsCount: 5,
      });

      expect(requestManager.execute).toHaveBeenCalled();
      expect(api.wall.getComments).toHaveBeenCalledWith({
        owner_id: 1,
        post_id: 2,
        need_likes: 0,
        extended: 0,
        count: 10,
        offset: 0,
        sort: 'desc',
        preview_length: undefined,
        comment_id: undefined,
        start_comment_id: undefined,
        thread_items_count: 5,
        fields: undefined,
      });

      expect(result).toEqual([
        {
          vkCommentId: 10,
          ownerId: 1,
          postId: 2,
          fromId: 123,
          text: 'parent',
          publishedAt: new Date(1_700_000_500 * 1000),
          likesCount: undefined,
          parentsStack: undefined,
          threadCount: 2,
          threadItems: [
            {
              vkCommentId: 12,
              ownerId: 1,
              postId: 2,
              fromId: 123,
              text: 'child',
              publishedAt: new Date(1_700_000_700 * 1000),
              likesCount: undefined,
              parentsStack: undefined,
              threadCount: undefined,
              threadItems: undefined,
              attachments: undefined,
              replyToUser: undefined,
              replyToComment: undefined,
              isDeleted: false,
            },
          ],
          attachments: undefined,
          replyToUser: undefined,
          replyToComment: undefined,
          isDeleted: false,
        },
      ]);
    });

    it('останавливает пагинацию при достижении baseline', async () => {
      const { service, api, requestManager } = createService();

      const responseMock = {
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
      };

      api.wall.getComments.mockResolvedValue(responseMock);
      requestManager.execute.mockImplementation(
        (fn: () => Promise<unknown>) => {
          return Promise.resolve(fn());
        },
      );

      const result = await service.getAuthorCommentsForPost({
        ownerId: 1,
        postId: 2,
        authorVkId: 123,
        baseline: new Date(1_700_000_100 * 1000),
        batchSize: 20,
        maxPages: 3,
      });

      expect(requestManager.execute).toHaveBeenCalled();
      expect(api.wall.getComments).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe('getComments', () => {
    it('преобразует вложенные треды и даты', async () => {
      const { service, api, requestManager } = createService();

      const responseMock = {
        count: 2,
        current_level_count: 2,
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
                        thread: {
                          count: 0,
                          items: [],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      };

      api.wall.getComments.mockResolvedValue(responseMock);
      requestManager.execute.mockImplementation(
        (fn: () => Promise<unknown>) => {
          return Promise.resolve(fn());
        },
      );

      const response = await service.getComments({ ownerId: -100, postId: 55 });

      expect(response.items).toHaveLength(1);
      const [parent] = response.items;
      expect(parent.threadItems).toHaveLength(1);
      const [child] = parent.threadItems ?? [];
      expect(child.threadItems).toHaveLength(1);
      const [nested] = child.threadItems ?? [];

      expect(parent.publishedAt).toBeInstanceOf(Date);
      expect(parent.publishedAt.toISOString()).toBe('2023-11-14T22:15:00.000Z');
      expect(child.publishedAt).toBeInstanceOf(Date);
      expect(child.publishedAt.toISOString()).toBe('2023-11-14T22:16:40.000Z');
      expect(nested.publishedAt).toBeInstanceOf(Date);
      expect(nested.publishedAt.toISOString()).toBe('2023-11-14T22:18:20.000Z');

      expect(parent.ownerId).toBe(-100);
      expect(parent.postId).toBe(55);
      expect(child.ownerId).toBe(-100);
      expect(child.postId).toBe(55);
      expect(nested.ownerId).toBe(-100);
      expect(nested.postId).toBe(55);

      expect(nested.threadItems).toBeUndefined();
      expect(parent.isDeleted).toBe(false);
      expect(child.isDeleted).toBe(false);
      expect(nested.isDeleted).toBe(false);
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
  });
});
