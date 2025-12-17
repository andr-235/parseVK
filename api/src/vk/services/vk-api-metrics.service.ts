import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitHits: number;
  circuitBreakerOpens: number;
  averageResponseTimeMs: number;
  lastRequestTime: number | null;
}

export interface RequestTiming {
  startTime: number;
  endTime?: number;
  duration?: number;
}

/**
 * Сервис для сбора метрик запросов к VK API
 *
 * Отслеживает:
 * - Количество успешных/неуспешных запросов
 * - Время ответа
 * - Rate limit hits
 * - Circuit breaker состояния
 */
@Injectable()
export class VkApiMetricsService {
  private readonly logger = new Logger(VkApiMetricsService.name);
  private readonly metricsKey = 'vk-api:metrics';
  private readonly metricsTtl = 3600 * 1000; // 1 час

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Записывает начало запроса
   * @returns Объект для отслеживания времени
   */
  startRequest(): RequestTiming {
    return {
      startTime: Date.now(),
    };
  }

  /**
   * Записывает успешное завершение запроса
   * @param method Метод API
   * @param timing Объект отслеживания времени
   */
  async recordSuccess(method: string, timing: RequestTiming): Promise<void> {
    const endTime = Date.now();
    const duration = endTime - timing.startTime;

    timing.endTime = endTime;
    timing.duration = duration;

    try {
      const metrics = await this.getMetrics();
      metrics.totalRequests += 1;
      metrics.successfulRequests += 1;
      metrics.lastRequestTime = endTime;

      // Обновляем среднее время ответа
      if (metrics.totalRequests > 0) {
        const totalDuration =
          metrics.averageResponseTimeMs * (metrics.totalRequests - 1) +
          duration;
        metrics.averageResponseTimeMs = totalDuration / metrics.totalRequests;
      } else {
        metrics.averageResponseTimeMs = duration;
      }

      await this.saveMetrics(metrics);
    } catch (error) {
      this.logger.warn(
        `Failed to record success metrics for ${method}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Записывает неудачное завершение запроса
   * @param method Метод API
   * @param timing Объект отслеживания времени
   */
  async recordFailure(method: string, timing: RequestTiming): Promise<void> {
    const endTime = Date.now();
    const duration = endTime - timing.startTime;

    timing.endTime = endTime;
    timing.duration = duration;

    try {
      const metrics = await this.getMetrics();
      metrics.totalRequests += 1;
      metrics.failedRequests += 1;
      metrics.lastRequestTime = endTime;

      // Обновляем среднее время ответа
      if (metrics.totalRequests > 0) {
        const totalDuration =
          metrics.averageResponseTimeMs * (metrics.totalRequests - 1) +
          duration;
        metrics.averageResponseTimeMs = totalDuration / metrics.totalRequests;
      } else {
        metrics.averageResponseTimeMs = duration;
      }

      await this.saveMetrics(metrics);
    } catch (error) {
      this.logger.warn(
        `Failed to record failure metrics for ${method}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Записывает hit rate limit
   */
  async recordRateLimitHit(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      metrics.rateLimitHits += 1;
      await this.saveMetrics(metrics);
    } catch (error) {
      this.logger.warn(
        'Failed to record rate limit hit',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Записывает открытие circuit breaker
   */
  async recordCircuitBreakerOpen(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      metrics.circuitBreakerOpens += 1;
      await this.saveMetrics(metrics);
    } catch (error) {
      this.logger.warn(
        'Failed to record circuit breaker open',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Получает текущие метрики
   * @returns Текущие метрики
   */
  async getMetrics(): Promise<RequestMetrics> {
    try {
      const cached = await this.cacheManager.get<RequestMetrics>(
        this.metricsKey,
      );
      if (cached) {
        return cached;
      }
    } catch (error) {
      this.logger.warn(
        'Failed to get metrics from cache',
        error instanceof Error ? error.stack : undefined,
      );
    }

    // Возвращаем метрики по умолчанию
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      circuitBreakerOpens: 0,
      averageResponseTimeMs: 0,
      lastRequestTime: null,
    };
  }

  /**
   * Сохраняет метрики в кэш
   * @param metrics Метрики для сохранения
   */
  private async saveMetrics(metrics: RequestMetrics): Promise<void> {
    try {
      await this.cacheManager.set(this.metricsKey, metrics, this.metricsTtl);
    } catch (error) {
      this.logger.warn(
        'Failed to save metrics to cache',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Сбрасывает метрики
   */
  async resetMetrics(): Promise<void> {
    try {
      await this.cacheManager.del(this.metricsKey);
      this.logger.log('Metrics reset');
    } catch (error) {
      this.logger.warn(
        'Failed to reset metrics',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Получает успешность запросов в процентах
   * @returns Процент успешных запросов
   */
  async getSuccessRate(): Promise<number> {
    const metrics = await this.getMetrics();
    if (metrics.totalRequests === 0) {
      return 100;
    }
    return (metrics.successfulRequests / metrics.totalRequests) * 100;
  }
}
