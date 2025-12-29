/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { VkCacheService } from './vk-cache.service';

describe('VkCacheService', () => {
  let service: VkCacheService;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VkCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager as any,
        },
      ],
    }).compile();

    service = module.get<VkCacheService>(VkCacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value when exists', async () => {
      const testData = { test: 'value' };
      cacheManager.get.mockResolvedValue(testData);

      const result = await service.get('test-key');

      expect(result).toEqual(testData);
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when cache miss', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null on cache error', async () => {
      cacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      const testData = { test: 'value' };

      await service.set('test-key', testData, 300);

      expect(cacheManager.set).toHaveBeenCalledWith(
        'test-key',
        testData,
        300 * 1000,
      );
    });

    it('should handle cache set error gracefully', async () => {
      cacheManager.set.mockRejectedValue(new Error('Cache error'));

      await expect(
        service.set('test-key', 'value', 300),
      ).resolves.toBeUndefined();
    });
  });

  describe('cachedRequest', () => {
    it('should return cached value if exists', async () => {
      const cachedData = { cached: true };
      const requestFn = jest.fn();

      cacheManager.get.mockResolvedValue(cachedData);

      const result = await service.cachedRequest('test-key', 300, requestFn);

      expect(result).toEqual(cachedData);
      expect(requestFn).not.toHaveBeenCalled();
    });

    it('should execute request and cache result on cache miss', async () => {
      const requestData = { fresh: true };
      const requestFn = jest.fn().mockResolvedValue(requestData);

      cacheManager.get.mockResolvedValue(null);

      const result = await service.cachedRequest('test-key', 300, requestFn);

      expect(result).toEqual(requestData);
      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'test-key',
        requestData,
        300 * 1000,
      );
    });
  });

  describe('delete', () => {
    it('should delete key from cache', async () => {
      await service.delete('test-key');

      expect(cacheManager.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle cache delete error gracefully', async () => {
      cacheManager.del.mockRejectedValue(new Error('Cache error'));

      await expect(service.delete('test-key')).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it.skip('should clear all cache', async () => {
      await service.clear();

      expect((cacheManager as any).reset).toHaveBeenCalled();
    });

    it.skip('should handle cache clear error gracefully', async () => {
      (cacheManager as any).reset.mockRejectedValue(new Error('Cache error'));

      await expect(service.clear()).resolves.toBeUndefined();
    });
  });

  describe('createCachedMethod', () => {
    it('should create cached method that uses cache', async () => {
      const mockMethod = jest.fn().mockResolvedValue('result');
      const keyGenerator = jest.fn().mockReturnValue('generated-key');

      const cachedMethod = service.createCachedMethod(
        'testMethod',
        300,
        mockMethod,
        keyGenerator,
      );

      cacheManager.get.mockResolvedValue(null);

      const result = await cachedMethod('arg1', 'arg2');

      expect(result).toBe('result');
      expect(keyGenerator).toHaveBeenCalledWith('arg1', 'arg2');
      expect(cacheManager.get).toHaveBeenCalledWith('generated-key');
      expect(mockMethod).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});
