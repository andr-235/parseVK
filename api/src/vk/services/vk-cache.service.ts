/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/**
 * Сервис для кэширования VK API запросов
 */
@Injectable()
export class VkCacheService {
  private readonly logger = new Logger(VkCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Получает значение из кэша
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.cacheManager.get<T>(key);
      if (cached) {
        this.logger.debug(`Cache HIT: ${key}`);
        return cached;
      }
      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  }

  /**
   * Сохраняет значение в кэш
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttlSeconds * 1000);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}`, error);
    }
  }

  /**
   * Выполняет кэшированный запрос
   */
  async cachedRequest<T>(
    key: string,
    ttlSeconds: number,
    requestFn: () => Promise<T>,
  ): Promise<T> {
    // Проверяем кэш
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    // Выполняем запрос
    const result = await requestFn();

    // Сохраняем в кэш
    await this.set(key, result, ttlSeconds);

    return result;
  }

  /**
   * Очищает кэш по ключу
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DELETE: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}`, error);
    }
  }

  /**
   * Очищает весь кэш
   */
  async clear(): Promise<void> {
    try {
      await (this.cacheManager as any).reset();
      this.logger.debug('Cache CLEARED');
    } catch (error) {
      this.logger.error(`Cache clear error: ${String(error)}`);
    }
  }

  /**
   * Создает кэшированный метод для сервиса
   */
  createCachedMethod<T extends any[], R>(
    methodName: string,
    ttlSeconds: number,
    method: (...args: T) => Promise<R>,
    keyGenerator: (...args: T) => string,
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const key = keyGenerator(...args);
      return this.cachedRequest(key, ttlSeconds, () => method(...args));
    };
  }
}
