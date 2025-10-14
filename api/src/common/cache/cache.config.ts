import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  async createCacheOptions(): Promise<CacheModuleOptions> {
    return {
      store: await redisStore({
        socket: {
          host: process.env.REDIS_HOST || 'redis',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
        ttl: 3600 * 1000, // 1 час в миллисекундах
      }),
      isGlobal: true,
    };
  }
}
