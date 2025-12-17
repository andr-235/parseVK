import { Injectable, Logger } from '@nestjs/common';
import { VkApiRateLimiter } from './vk-api-rate-limiter.service';
import { VkApiRetryService } from './vk-api-retry.service';
import {
  VkApiCircuitBreaker,
  CircuitBreakerState,
} from './vk-api-circuit-breaker.service';
import { VkApiMetricsService } from './vk-api-metrics.service';
import type { RateLimitOptions } from './vk-api-rate-limiter.service';
import type { RetryOptions } from './vk-api-retry.service';
import type { CircuitBreakerOptions } from './vk-api-circuit-breaker.service';

export interface RequestManagerOptions {
  rateLimit?: RateLimitOptions;
  retry?: RetryOptions;
  circuitBreaker?: CircuitBreakerOptions;
  method?: string;
  key?: string;
}

/**
 * Централизованный менеджер запросов к VK API
 *
 * Объединяет все компоненты управления запросами:
 * - Rate limiting
 * - Retry с exponential backoff
 * - Circuit breaker
 * - Метрики
 *
 * Все запросы к VK API должны проходить через этот менеджер.
 */
@Injectable()
export class VkApiRequestManager {
  private readonly logger = new Logger(VkApiRequestManager.name);

  constructor(
    private readonly rateLimiter: VkApiRateLimiter,
    private readonly retryService: VkApiRetryService,
    private readonly circuitBreaker: VkApiCircuitBreaker,
    private readonly metricsService: VkApiMetricsService,
  ) {}

  /**
   * Выполняет запрос к VK API с полной защитой
   * @param fn Функция для выполнения запроса
   * @param options Опции управления запросом
   * @returns Результат выполнения запроса
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: RequestManagerOptions = {},
  ): Promise<T> {
    const method = options.method ?? 'unknown';
    const key = options.key ?? 'vk-api:global';
    const timing = this.metricsService.startRequest();

    try {
      // 1. Проверяем circuit breaker
      const result = await this.circuitBreaker.execute(async () => {
        // 2. Проверяем rate limit
        const rateLimitAllowed = await this.rateLimiter.checkRateLimit(
          options.rateLimit ?? { key },
        );

        if (!rateLimitAllowed) {
          await this.metricsService.recordRateLimitHit();
          this.logger.debug(`Rate limit hit for ${key}, waiting for slot`);

          // Ждем освобождения слота
          await this.rateLimiter.waitForSlot(
            options.rateLimit ?? { key },
            10000,
          );
        }

        // 3. Выполняем запрос с retry
        return await this.retryService.executeWithRetry(fn, options.retry);
      }, options.circuitBreaker ?? { key });

      // 4. Записываем успешный запрос
      await this.metricsService.recordSuccess(method, timing);

      return result;
    } catch (error) {
      // Записываем неудачный запрос
      const err = error instanceof Error ? error : new Error(String(error));
      await this.metricsService.recordFailure(method, timing);

      // Если circuit breaker открыт, записываем это в метрики
      const state = await this.circuitBreaker.getState(
        key,
        options.circuitBreaker,
      );
      if (state === CircuitBreakerState.OPEN) {
        await this.metricsService.recordCircuitBreakerOpen();
      }

      throw err;
    }
  }

  /**
   * Выполняет запрос без retry (для случаев, когда retry не нужен)
   * @param fn Функция для выполнения запроса
   * @param options Опции управления запросом
   * @returns Результат выполнения запроса
   */
  async executeWithoutRetry<T>(
    fn: () => Promise<T>,
    options: RequestManagerOptions = {},
  ): Promise<T> {
    const method = options.method ?? 'unknown';
    const key = options.key ?? 'vk-api:global';
    const timing = this.metricsService.startRequest();

    try {
      const result = await this.circuitBreaker.execute(async () => {
        const rateLimitAllowed = await this.rateLimiter.checkRateLimit(
          options.rateLimit ?? { key },
        );

        if (!rateLimitAllowed) {
          await this.metricsService.recordRateLimitHit();
          await this.rateLimiter.waitForSlot(
            options.rateLimit ?? { key },
            10000,
          );
        }

        return await fn();
      }, options.circuitBreaker ?? { key });

      await this.metricsService.recordSuccess(method, timing);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await this.metricsService.recordFailure(method, timing);

      const state = await this.circuitBreaker.getState(
        key,
        options.circuitBreaker,
      );
      if (state === CircuitBreakerState.OPEN) {
        await this.metricsService.recordCircuitBreakerOpen();
      }

      throw err;
    }
  }

  /**
   * Получает метрики запросов
   * @returns Текущие метрики
   */
  async getMetrics() {
    return await this.metricsService.getMetrics();
  }

  /**
   * Получает состояние circuit breaker
   * @param key Ключ circuit breaker
   * @param options Опции circuit breaker
   * @returns Текущее состояние
   */
  async getCircuitBreakerState(
    key: string = 'vk-api:global',
    options: CircuitBreakerOptions = {},
  ) {
    return await this.circuitBreaker.getState(key, options);
  }

  /**
   * Сбрасывает circuit breaker
   * @param key Ключ circuit breaker
   */
  async resetCircuitBreaker(key: string = 'vk-api:global') {
    await this.circuitBreaker.reset(key);
  }

  /**
   * Получает количество оставшихся запросов в rate limit
   * @param options Опции rate limit
   * @returns Количество оставшихся запросов
   */
  async getRemainingRequests(options: RateLimitOptions = {}) {
    return await this.rateLimiter.getRemainingRequests(options);
  }
}
