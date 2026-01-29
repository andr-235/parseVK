import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { VkApiRateLimiter } from './vk-api-rate-limiter.service.js';

describe('VkApiRateLimiter', () => {
  let service: VkApiRateLimiter;
  let mockCacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'vkApiRateLimitRequests') return 3;
        if (key === 'vkApiRateLimitWindowMs') return 1000;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VkApiRateLimiter,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<VkApiRateLimiter>(VkApiRateLimiter);
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  it('должен разрешать запросы в пределах лимита', async () => {
    mockCacheManager.get.mockResolvedValue([]);

    const result1 = await service.checkRateLimit();
    expect(result1).toBe(true);

    mockCacheManager.get.mockResolvedValue([Date.now()]);
    const result2 = await service.checkRateLimit();
    expect(result2).toBe(true);
  });

  it('должен блокировать запросы при превышении лимита', async () => {
    const now = Date.now();
    mockCacheManager.get.mockResolvedValue([now, now - 100, now - 200]);

    const result = await service.checkRateLimit({ requests: 3 });
    expect(result).toBe(false);
  });
});
