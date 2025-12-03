import { redisStore } from 'cache-manager-redis-yet';
import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/app.config';

const DEFAULT_TTL_MS = 3600 * 1000;

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  private readonly logger = new Logger(CacheConfigService.name);

  constructor(private readonly configService: ConfigService<AppConfig>) {}

  async createCacheOptions(): Promise<CacheModuleOptions> {
    const host =
      this.configService.get('redisHost', { infer: true }) || 'redis';
    const port = this.configService.get('redisPort', { infer: true }) || 6379;

    try {
      const store = await redisStore({
        socket: {
          host,
          port,
        },
        ttl: DEFAULT_TTL_MS, // 1 час в миллисекундах
      });

      this.logger.log(`Используется Redis кэш по адресу ${host}:${port}`);

      return {
        store,
        ttl: DEFAULT_TTL_MS,
        isGlobal: true,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Не удалось подключиться к Redis (${host}:${port}). Переключаюсь на встроенный in-memory кэш. Причина: ${reason}`,
      );

      return {
        ttl: DEFAULT_TTL_MS,
        isGlobal: true,
      };
    }
  }
}
