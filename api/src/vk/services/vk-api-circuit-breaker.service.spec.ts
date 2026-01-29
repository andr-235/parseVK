import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import {
  VkApiCircuitBreaker,
  CircuitBreakerState,
} from './vk-api-circuit-breaker.service.js';

describe('VkApiCircuitBreaker', () => {
  let service: VkApiCircuitBreaker;
  let mockCacheManager: {
    get: vi.Mock;
    set: vi.Mock;
    del: vi.Mock;
  };

  beforeEach(async () => {
    mockCacheManager = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    };

    const mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'vkApiCircuitBreakerFailureThreshold') return 5;
        if (key === 'vkApiCircuitBreakerResetTimeoutMs') return 60000;
        if (key === 'vkApiCircuitBreakerHalfOpenMaxCalls') return 3;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VkApiCircuitBreaker,
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

    service = module.get<VkApiCircuitBreaker>(VkApiCircuitBreaker);
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  it('должен выполнять запрос при закрытом circuit breaker', async () => {
    mockCacheManager.get.mockResolvedValue(CircuitBreakerState.CLOSED);
    const fn = vi.fn().mockResolvedValue('success');

    const result = await service.execute(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('должен блокировать запросы при открытом circuit breaker', async () => {
    mockCacheManager.get.mockResolvedValue(CircuitBreakerState.OPEN);
    const fn = vi.fn().mockResolvedValue('success');

    await expect(service.execute(fn)).rejects.toThrow(
      'Circuit breaker is OPEN',
    );
    expect(fn).not.toHaveBeenCalled();
  });
});
