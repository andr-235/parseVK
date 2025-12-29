/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { VK } from 'vk-io';
import { VkUsersService } from './vk-users.service';
import { VkCacheService } from './vk-cache.service';
import { VkApiRequestManager } from './vk-api-request-manager.service';
import { VkApiBatchingService } from './vk-api-batching.service';

describe('VkUsersService', () => {
  let service: VkUsersService;
  let cacheService: jest.Mocked<VkCacheService>;
  let requestManager: jest.Mocked<VkApiRequestManager>;
  let batchingService: jest.Mocked<VkApiBatchingService>;

  beforeEach(async () => {
    const mockVk = {
      api: {
        users: {
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

    const mockBatchingService = {
      batch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VkUsersService,
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
        {
          provide: VkApiBatchingService,
          useValue: mockBatchingService,
        },
      ],
    }).compile();

    service = module.get<VkUsersService>(VkUsersService);
    cacheService = module.get(VkCacheService);
    requestManager = module.get(VkApiRequestManager);
    batchingService = module.get(VkApiBatchingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthors', () => {
    it('should return empty array for empty input', async () => {
      const result = await service.getAuthors([]);

      expect(result).toEqual([]);
      expect(cacheService.cachedRequest).not.toHaveBeenCalled();
    });

    it('should fetch and cache authors', async () => {
      const userIds = ['123', 456];
      const mockUsers: any[] = [
        {
          id: 123,
          first_name: 'John',
          last_name: 'Doe',
          is_closed: false,
        },
        {
          id: 456,
          first_name: 'Jane',
          last_name: 'Smith',
          is_closed: true,
        },
      ];

      const expectedNormalized = [
        {
          id: 123,
          first_name: 'John',
          last_name: 'Doe',
          deactivated: undefined,
          is_closed: false,
          can_access_closed: undefined,
          domain: undefined,
          screen_name: undefined,
          photo_50: undefined,
          photo_100: undefined,
          photo_200: undefined,
          photo_200_orig: undefined,
          photo_400_orig: undefined,
          photo_max: undefined,
          photo_max_orig: undefined,
          photo_id: undefined,
          city: undefined,
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
        {
          id: 456,
          first_name: 'Jane',
          last_name: 'Smith',
          deactivated: undefined,
          is_closed: true,
          can_access_closed: undefined,
          domain: undefined,
          screen_name: undefined,
          photo_50: undefined,
          photo_100: undefined,
          photo_200: undefined,
          photo_200_orig: undefined,
          photo_400_orig: undefined,
          photo_max: undefined,
          photo_max_orig: undefined,
          photo_id: undefined,
          city: undefined,
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
      ];

      batchingService.batch.mockResolvedValue(mockUsers);
      cacheService.cachedRequest.mockImplementation(
        async (key, ttl, requestFn) => await requestFn(),
      );

      const result = await service.getAuthors(userIds);

      expect(result).toEqual(expectedNormalized);
      expect(cacheService.cachedRequest).toHaveBeenCalledWith(
        expect.stringContaining('vk:user:batch:'),
        1800, // CACHE_TTL.VK_USER
        expect.any(Function),
      );
    });

    it('should normalize user IDs', async () => {
      const userIds = ['123', '456'];
      const mockUsers: any[] = [
        { id: 123, first_name: 'John', last_name: 'Doe', is_closed: false },
      ];

      batchingService.batch.mockResolvedValue(mockUsers);
      cacheService.cachedRequest.mockImplementation(
        async (key, ttl, requestFn) => await requestFn(),
      );

      await service.getAuthors(userIds);

      expect(batchingService.batch).toHaveBeenCalledWith(
        [123, 456],
        expect.any(Function),
        { maxBatchSize: 1000 },
      );
    });
  });

  describe('getAuthorsWithExtendedFields', () => {
    it('should warn about extended fields for multiple users', async () => {
      const loggerWarnSpy = jest
        .spyOn(service['logger'], 'warn')
        .mockImplementation();

      const userIds = [123, 456];
      const mockUsers: any[] = [
        { id: 123, first_name: 'John', last_name: 'Doe', is_closed: false },
        { id: 456, first_name: 'Jane', last_name: 'Smith', is_closed: false },
      ];

      batchingService.batch.mockResolvedValue(mockUsers);
      cacheService.cachedRequest.mockImplementation(
        async (key, ttl, requestFn) => await requestFn(),
      );

      const result = await service.getAuthorsWithExtendedFields(userIds);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Requesting extended fields'),
      );
      expect(result).toHaveLength(2);

      loggerWarnSpy.mockRestore();
    });

    it('should fetch extended fields for single user', async () => {
      const userId = 123;
      const mockUser: any[] = [
        {
          id: 123,
          first_name: 'John',
          last_name: 'Doe',
          is_closed: false,
          counters: { friends: 100 },
          military: [{ unit: 'Unit' }],
        },
      ];

      requestManager.execute.mockResolvedValue(mockUser);

      const result = await service.getAuthorsWithExtendedFields([userId]);

      expect(result).toHaveLength(1);
      expect(result[0].counters).toEqual({ friends: 100 });
      expect(result[0].military).toEqual([{ unit: 'Unit' }]);
      expect(requestManager.execute).toHaveBeenCalledWith(
        expect.any(Function),
        {
          method: 'users.get',
          key: `users:get:${userId}:extended`,
        },
      );
    });
  });
});
