import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';
import * as redisStoreModule from 'cache-manager-redis-yet';
import { CacheConfigService } from './cache.config.js';
import type { AppConfig } from '../../config/app.config.js';

describe('CacheConfigService', () => {
  let redisStoreMock: vi.SpyInstance;
  let logSpy: vi.SpyInstance;
  let warnSpy: vi.SpyInstance;
  let configService: ConfigService<AppConfig>;

  const createConfigService = (): ConfigService<AppConfig> => {
    return {
      get: vi.fn((key: string) => {
        if (key === 'redisHost') {
          return process.env.REDIS_HOST;
        }
        if (key === 'redisPort') {
          return process.env.REDIS_PORT
            ? Number(process.env.REDIS_PORT)
            : undefined;
        }
        return undefined;
      }),
    } as unknown as ConfigService<AppConfig>;
  };

  beforeAll(() => {
    logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterAll(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    redisStoreMock?.mockRestore();
  });

  beforeEach(() => {
    redisStoreMock = vi.spyOn(redisStoreModule, 'redisStore');
  });

  afterEach(() => {
    redisStoreMock.mockReset();
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
  });

  it('использует Redis store при успешном подключении', async () => {
    process.env.REDIS_HOST = 'cache.internal';
    process.env.REDIS_PORT = '6380';

    const redisInstance = { name: 'redis-store' };
    redisStoreMock.mockResolvedValue(redisInstance);
    configService = createConfigService();

    const service = new CacheConfigService(configService);
    const options = await service.createCacheOptions();

    expect(redisStoreMock).toHaveBeenCalledWith({
      socket: {
        host: 'cache.internal',
        port: 6380,
      },
      ttl: 3600 * 1000,
    });
    expect(options.store).toBe(redisInstance);
    expect(options.ttl).toBe(3600 * 1000);
    expect(options.isGlobal).toBe(true);
  });

  it('переходит на in-memory store при ошибке Redis', async () => {
    redisStoreMock.mockRejectedValue(new Error('connect ECONNREFUSED'));
    configService = createConfigService();

    const service = new CacheConfigService(configService);
    const options = await service.createCacheOptions();

    expect(redisStoreMock).toHaveBeenCalledTimes(1);
    expect(options).not.toHaveProperty('store');
    expect(options.ttl).toBe(3600 * 1000);
    expect(options.isGlobal).toBe(true);
  });
});
