import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as redisStoreModule from 'cache-manager-redis-yet';
import { CacheConfigService } from './cache.config';
import type { AppConfig } from '../../config/app.config';

describe('CacheConfigService', () => {
  let redisStoreMock: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let configService: ConfigService<AppConfig>;

  const createConfigService = (): ConfigService<AppConfig> => {
    return {
      get: jest.fn((key: string) => {
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
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterAll(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    redisStoreMock?.mockRestore();
  });

  beforeEach(() => {
    redisStoreMock = jest.spyOn(redisStoreModule, 'redisStore');
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
