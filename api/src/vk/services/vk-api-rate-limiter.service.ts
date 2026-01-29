import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { AppConfig } from '../../config/app.config.js';

export interface RateLimitOptions {
  requests?: number;
  windowMs?: number;
  key?: string;
}

/**
 * Сервис для управления rate limiting запросов к VK API
 *
 * Использует Redis для распределенного rate limiting между несколькими инстансами приложения.
 * Реализует sliding window алгоритм для более точного контроля.
 */
@Injectable()
export class VkApiRateLimiter {
  private readonly logger = new Logger(VkApiRateLimiter.name);
  private readonly defaultRequests: number;
  private readonly defaultWindowMs: number;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService<AppConfig>,
  ) {
    this.defaultRequests =
      this.configService.get('vkApiRateLimitRequests', { infer: true }) ?? 3;
    this.defaultWindowMs =
      this.configService.get('vkApiRateLimitWindowMs', { infer: true }) ?? 1000;
  }

  /**
   * Проверяет, можно ли выполнить запрос согласно rate limit
   * @param options Опции rate limiting
   * @returns true если запрос разрешен, false если превышен лимит
   */
  async checkRateLimit(options: RateLimitOptions = {}): Promise<boolean> {
    const requests = options.requests ?? this.defaultRequests;
    const windowMs = options.windowMs ?? this.defaultWindowMs;
    const key = options.key ?? 'vk-api:global';

    try {
      const cacheKey = `rate-limit:${key}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Получаем список временных меток запросов из кэша
      const cached = await this.cacheManager.get<number[]>(cacheKey);
      const timestamps = cached ?? [];

      // Удаляем устаревшие записи (старше окна)
      const validTimestamps = timestamps.filter(
        (timestamp) => timestamp > windowStart,
      );

      // Проверяем, не превышен ли лимит
      if (validTimestamps.length >= requests) {
        this.logger.debug(
          `Rate limit exceeded for ${key}: ${validTimestamps.length}/${requests} requests in window`,
        );
        return false;
      }

      // Добавляем текущий запрос
      validTimestamps.push(now);

      // Сохраняем обновленный список с TTL равным окну
      await this.cacheManager.set(cacheKey, validTimestamps, windowMs);

      return true;
    } catch (error) {
      // В случае ошибки кэша разрешаем запрос (fail-open)
      this.logger.warn(
        `Rate limit check failed for ${key}, allowing request`,
        error instanceof Error ? error.stack : undefined,
      );
      return true;
    }
  }

  /**
   * Ожидает, пока не освободится слот для запроса
   * @param options Опции rate limiting
   * @param maxWaitMs Максимальное время ожидания в миллисекундах
   */
  async waitForSlot(
    options: RateLimitOptions = {},
    maxWaitMs: number = 10000,
  ): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 100; // проверяем каждые 100мс

    while (Date.now() - startTime < maxWaitMs) {
      const allowed = await this.checkRateLimit(options);
      if (allowed) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error(
      `Rate limit wait timeout: could not acquire slot within ${maxWaitMs}ms`,
    );
  }

  /**
   * Получает количество оставшихся запросов в текущем окне
   * @param options Опции rate limiting
   * @returns Количество оставшихся запросов
   */
  async getRemainingRequests(options: RateLimitOptions = {}): Promise<number> {
    const requests = options.requests ?? this.defaultRequests;
    const windowMs = options.windowMs ?? this.defaultWindowMs;
    const key = options.key ?? 'vk-api:global';

    try {
      const cacheKey = `rate-limit:${key}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      const cached = await this.cacheManager.get<number[]>(cacheKey);
      const timestamps = cached ?? [];
      const validTimestamps = timestamps.filter(
        (timestamp) => timestamp > windowStart,
      );

      return Math.max(0, requests - validTimestamps.length);
    } catch (error) {
      this.logger.warn(
        `Failed to get remaining requests for ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      return requests; // В случае ошибки возвращаем полный лимит
    }
  }
}
