import { Test, TestingModule } from '@nestjs/testing';
import { VK } from 'vk-io';
import { VkPostsService } from './vk-posts.service';
import { VkCacheService } from './vk-cache.service';
import { VkApiRequestManager } from './vk-api-request-manager.service';

describe('VkPostsService', () => {
  let service: VkPostsService;
  let vk: jest.Mocked<VK>;
  let cacheService: jest.Mocked<VkCacheService>;
  let requestManager: jest.Mocked<VkApiRequestManager>;

  beforeEach(async () => {
    const mockVk = {
      api: {
        wall: {
          getById: jest.fn(),
          get: jest.fn(),
        },
      },
    } as any;

    const mockCacheService = {
      cachedRequest: jest.fn(),
    };

    const mockRequestManager = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VkPostsService,
        {
          provide: VK,
          useValue: mockVk,
        },
        {
          provide: VkCacheService,
          useValue: mockCacheService,
        },
        {
          provide: VkApiRequestManager,
          useValue: mockRequestManager,
        },
      ],
    }).compile();

    service = module.get<VkPostsService>(VkPostsService);
    vk = module.get(VK);
    cacheService = module.get(VkCacheService);
    requestManager = module.get(VkApiRequestManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPosts', () => {
    it('should return empty result for empty input', async () => {
      const result = await service.getPosts([]);

      expect(result).toEqual({ items: [], profiles: [], groups: [] });
      expect(requestManager.execute).not.toHaveBeenCalled();
    });

    it('should fetch posts by IDs', async () => {
      const posts = [
        { ownerId: -123, postId: 456 },
        { ownerId: -789, postId: 101 },
      ];

      const mockResponse = {
        items: [
          { id: 456, owner_id: -123, text: 'Post 1' },
          { id: 101, owner_id: -789, text: 'Post 2' },
        ],
        profiles: [],
        groups: [],
      };

      requestManager.execute.mockResolvedValue(mockResponse);

      const result = await service.getPosts(posts);

      expect(result).toEqual(mockResponse);
      expect(requestManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        {
          method: 'wall.getById',
          key: 'wall:getById',
        },
      );
    });
  });

  describe('getGroupRecentPosts', () => {
    it('should fetch and cache recent posts', async () => {
      const options = {
        ownerId: -123,
        count: 5,
        offset: 10,
      };

      const mockPosts = [
        {
          id: 456,
          owner_id: -123,
          from_id: 789,
          date: 1234567890,
          text: 'Test post',
          attachments: [],
          comments: {
            count: 10,
            can_post: 1,
            groups_can_post: false,
            can_close: true,
            can_open: false,
          },
        },
      ];

      const mockResponse = { items: mockPosts };
      const expectedNormalized = [
        {
          id: 456,
          owner_id: -123,
          from_id: 789,
          date: 1234567890,
          text: 'Test post',
          attachments: [],
          comments: {
            count: 10,
            can_post: 1,
            groups_can_post: false,
            can_close: true,
            can_open: false,
          },
        },
      ];

      requestManager.execute.mockResolvedValue(mockResponse);
      cacheService.cachedRequest.mockImplementation(
        async (key, ttl, requestFn) => await requestFn(),
      );

      const result = await service.getGroupRecentPosts(options);

      expect(result).toEqual(expectedNormalized);
      expect(cacheService.cachedRequest).toHaveBeenCalledWith(
        expect.stringContaining('vk:post:'),
        600, // CACHE_TTL.VK_POST
        expect.any(Function),
      );
      expect(requestManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          method: 'wall.get',
          key: `wall:${options.ownerId}`,
        }),
      );
    });

    it('should use default values for optional parameters', async () => {
      const options = { ownerId: -123 };

      const mockResponse = { items: [] };
      requestManager.execute.mockResolvedValue(mockResponse);
      cacheService.cachedRequest.mockImplementation(
        async (key, ttl, requestFn) => await requestFn(),
      );

      await service.getGroupRecentPosts(options);

      expect(requestManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          method: 'wall.get',
          key: 'wall:-123',
        }),
      );
    });

    it('should limit count to maximum allowed', async () => {
      const options = { ownerId: -123, count: 200 };

      const mockResponse = { items: [] };
      requestManager.execute.mockResolvedValue(mockResponse);
      cacheService.cachedRequest.mockImplementation(
        async (key, ttl, requestFn) => await requestFn(),
      );

      await service.getGroupRecentPosts(options);

      expect(requestManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          method: 'wall.get',
          key: 'wall:-123',
        }),
      );
    });
  });
});
