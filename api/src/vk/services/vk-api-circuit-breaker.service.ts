import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { AppConfig } from '../../config/app.config';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED', // Нормальная работа
  OPEN = 'OPEN', // Цепь разомкнута, запросы блокируются
  HALF_OPEN = 'HALF_OPEN', // Тестовый режим для проверки восстановления
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenMaxCalls?: number;
  key?: string;
}

/**
 * Сервис для реализации Circuit Breaker паттерна для VK API
 *
 * Защищает от перегрузки API при частых ошибках.
 * Автоматически открывает/закрывает цепь в зависимости от состояния API.
 */
@Injectable()
export class VkApiCircuitBreaker {
  private readonly logger = new Logger(VkApiCircuitBreaker.name);
  private readonly defaultFailureThreshold: number;
  private readonly defaultResetTimeoutMs: number;
  private readonly defaultHalfOpenMaxCalls: number;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService<AppConfig>,
  ) {
    this.defaultFailureThreshold =
      this.configService.get('vkApiCircuitBreakerFailureThreshold', {
        infer: true,
      }) ?? 5;
    this.defaultResetTimeoutMs =
      this.configService.get('vkApiCircuitBreakerResetTimeoutMs', {
        infer: true,
      }) ?? 60000;
    this.defaultHalfOpenMaxCalls =
      this.configService.get('vkApiCircuitBreakerHalfOpenMaxCalls', {
        infer: true,
      }) ?? 3;
  }

  /**
   * Выполняет функцию через circuit breaker
   * @param fn Функция для выполнения
   * @param options Опции circuit breaker
   * @returns Результат выполнения функции
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: CircuitBreakerOptions = {},
  ): Promise<T> {
    const key = options.key ?? 'vk-api:global';
    const state = await this.getState(key, options);

    if (state === CircuitBreakerState.OPEN) {
      const error = new Error(
        `Circuit breaker is OPEN for ${key}. API calls are temporarily blocked.`,
      );
      this.logger.warn(error.message);
      throw error;
    }

    try {
      const result = await fn();

      // Успешный запрос - сбрасываем счетчик ошибок
      await this.recordSuccess(key, options, state);

      return result;
    } catch (error) {
      // Ошибка - увеличиваем счетчик
      await this.recordFailure(key, options, state);

      throw error;
    }
  }

  /**
   * Получает текущее состояние circuit breaker
   * @param key Ключ для идентификации circuit breaker
   * @param options Опции
   * @returns Текущее состояние
   */
  async getState(
    key: string,
    options: CircuitBreakerOptions = {},
  ): Promise<CircuitBreakerState> {
    const failureThreshold =
      options.failureThreshold ?? this.defaultFailureThreshold;
    const resetTimeoutMs = options.resetTimeoutMs ?? this.defaultResetTimeoutMs;

    try {
      const stateKey = `circuit-breaker:state:${key}`;
      const failureKey = `circuit-breaker:failures:${key}`;
      const lastFailureKey = `circuit-breaker:last-failure:${key}`;

      const cachedState = await this.cacheManager.get<string>(stateKey);
      const failures = (await this.cacheManager.get<number>(failureKey)) ?? 0;
      const lastFailure = await this.cacheManager.get<number>(lastFailureKey);

      // Если цепь открыта, проверяем, не прошло ли достаточно времени для перехода в HALF_OPEN
      if (cachedState === CircuitBreakerState.OPEN) {
        if (lastFailure && Date.now() - lastFailure >= resetTimeoutMs) {
          // Переходим в HALF_OPEN для тестирования
          await this.cacheManager.set(stateKey, CircuitBreakerState.HALF_OPEN);
          return CircuitBreakerState.HALF_OPEN;
        }
        return CircuitBreakerState.OPEN;
      }

      // Если цепь в HALF_OPEN, возвращаем как есть
      if (cachedState === CircuitBreakerState.HALF_OPEN) {
        return CircuitBreakerState.HALF_OPEN;
      }

      // Если количество ошибок превышает порог, открываем цепь
      if (failures >= failureThreshold) {
        await this.cacheManager.set(stateKey, CircuitBreakerState.OPEN);
        await this.cacheManager.set(lastFailureKey, Date.now());
        this.logger.warn(
          `Circuit breaker opened for ${key} after ${failures} failures`,
        );
        return CircuitBreakerState.OPEN;
      }

      // По умолчанию цепь закрыта
      return CircuitBreakerState.CLOSED;
    } catch (error) {
      // В случае ошибки кэша считаем цепь закрытой (fail-open)
      this.logger.warn(
        `Failed to get circuit breaker state for ${key}, defaulting to CLOSED`,
        error instanceof Error ? error.stack : undefined,
      );
      return CircuitBreakerState.CLOSED;
    }
  }

  /**
   * Записывает успешный запрос
   * @param key Ключ
   * @param options Опции
   * @param currentState Текущее состояние
   */
  private async recordSuccess(
    key: string,
    options: CircuitBreakerOptions,
    currentState: CircuitBreakerState,
  ): Promise<void> {
    try {
      const failureKey = `circuit-breaker:failures:${key}`;
      const stateKey = `circuit-breaker:state:${key}`;
      const halfOpenCallsKey = `circuit-breaker:half-open-calls:${key}`;

      // Сбрасываем счетчик ошибок
      await this.cacheManager.set(failureKey, 0);

      // Если были в HALF_OPEN и успешно выполнили запросы, закрываем цепь
      if (currentState === CircuitBreakerState.HALF_OPEN) {
        const halfOpenCalls =
          (await this.cacheManager.get<number>(halfOpenCallsKey)) ?? 0;
        const maxCalls =
          options.halfOpenMaxCalls ?? this.defaultHalfOpenMaxCalls;

        if (halfOpenCalls + 1 >= maxCalls) {
          await this.cacheManager.set(stateKey, CircuitBreakerState.CLOSED);
          await this.cacheManager.del(halfOpenCallsKey);
          this.logger.log(`Circuit breaker closed for ${key} after recovery`);
        } else {
          await this.cacheManager.set(
            halfOpenCallsKey,
            halfOpenCalls + 1,
            60000,
          );
        }
      } else {
        // Убеждаемся, что цепь закрыта
        await this.cacheManager.set(stateKey, CircuitBreakerState.CLOSED);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to record success for ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Записывает неудачный запрос
   * @param key Ключ
   * @param options Опции
   * @param currentState Текущее состояние
   */
  private async recordFailure(
    key: string,
    options: CircuitBreakerOptions,
    currentState: CircuitBreakerState,
  ): Promise<void> {
    try {
      const failureKey = `circuit-breaker:failures:${key}`;
      const lastFailureKey = `circuit-breaker:last-failure:${key}`;
      const stateKey = `circuit-breaker:state:${key}`;
      const halfOpenCallsKey = `circuit-breaker:half-open-calls:${key}`;

      const currentFailures =
        (await this.cacheManager.get<number>(failureKey)) ?? 0;
      const newFailures = currentFailures + 1;

      await this.cacheManager.set(failureKey, newFailures);
      await this.cacheManager.set(lastFailureKey, Date.now());

      // Если были в HALF_OPEN и получили ошибку, снова открываем цепь
      if (currentState === CircuitBreakerState.HALF_OPEN) {
        await this.cacheManager.set(stateKey, CircuitBreakerState.OPEN);
        await this.cacheManager.del(halfOpenCallsKey);
        this.logger.warn(
          `Circuit breaker reopened for ${key} after failure in HALF_OPEN state`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to record failure for ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Принудительно сбрасывает состояние circuit breaker
   * @param key Ключ
   */
  async reset(key: string = 'vk-api:global'): Promise<void> {
    try {
      const stateKey = `circuit-breaker:state:${key}`;
      const failureKey = `circuit-breaker:failures:${key}`;
      const lastFailureKey = `circuit-breaker:last-failure:${key}`;
      const halfOpenCallsKey = `circuit-breaker:half-open-calls:${key}`;

      await this.cacheManager.del(stateKey);
      await this.cacheManager.del(failureKey);
      await this.cacheManager.del(lastFailureKey);
      await this.cacheManager.del(halfOpenCallsKey);

      this.logger.log(`Circuit breaker reset for ${key}`);
    } catch (error) {
      this.logger.warn(
        `Failed to reset circuit breaker for ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
