import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIError } from 'vk-io';
import type { AppConfig } from '../../config/app.config';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  multiplier?: number;
  retryableErrors?: number[];
}

/**
 * Сервис для управления retry логикой запросов к VK API
 *
 * Реализует exponential backoff стратегию с классификацией ошибок.
 * Определяет, какие ошибки можно повторять, а какие нет.
 */
@Injectable()
export class VkApiRetryService {
  private readonly logger = new Logger(VkApiRetryService.name);
  private readonly defaultMaxAttempts: number;
  private readonly defaultInitialDelayMs: number;
  private readonly defaultMaxDelayMs: number;
  private readonly defaultMultiplier: number;

  // Коды ошибок VK API, которые можно повторять
  private readonly defaultRetryableErrors = [
    1, // Unknown error
    6, // Too many requests per second
    9, // Flood control
    10, // Internal server error
    13, // Response processing failed
  ];

  constructor(private readonly configService: ConfigService<AppConfig>) {
    this.defaultMaxAttempts =
      this.configService.get('vkApiRetryMaxAttempts', { infer: true }) ?? 3;
    this.defaultInitialDelayMs =
      this.configService.get('vkApiRetryInitialDelayMs', { infer: true }) ??
      1000;
    this.defaultMaxDelayMs =
      this.configService.get('vkApiRetryMaxDelayMs', { infer: true }) ?? 10000;
    this.defaultMultiplier =
      this.configService.get('vkApiRetryMultiplier', { infer: true }) ?? 2;
  }

  /**
   * Выполняет функцию с retry логикой
   * @param fn Функция для выполнения
   * @param options Опции retry
   * @returns Результат выполнения функции
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const maxAttempts = options.maxAttempts ?? this.defaultMaxAttempts;
    const initialDelayMs = options.initialDelayMs ?? this.defaultInitialDelayMs;
    const maxDelayMs = options.maxDelayMs ?? this.defaultMaxDelayMs;
    const multiplier = options.multiplier ?? this.defaultMultiplier;
    const retryableErrors =
      options.retryableErrors ?? this.defaultRetryableErrors;

    let lastError: Error | null = null;
    let delay = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Проверяем, можно ли повторять эту ошибку
        if (!this.isRetryableError(error, retryableErrors)) {
          this.logger.debug(
            `Non-retryable error on attempt ${attempt}: ${lastError.message}`,
          );
          throw lastError;
        }

        // Если это последняя попытка, пробрасываем ошибку
        if (attempt >= maxAttempts) {
          this.logger.warn(
            `Max retry attempts (${maxAttempts}) reached, throwing error`,
          );
          throw lastError;
        }

        // Вычисляем задержку с exponential backoff
        const actualDelay = Math.min(delay, maxDelayMs);
        this.logger.debug(
          `Retry attempt ${attempt}/${maxAttempts} after ${actualDelay}ms: ${lastError.message}`,
        );

        await this.sleep(actualDelay);
        delay *= multiplier;
      }
    }

    // Этот код не должен выполняться, но TypeScript требует возврата
    throw lastError ?? new Error('Retry failed without error');
  }

  /**
   * Проверяет, можно ли повторять запрос при данной ошибке
   * @param error Ошибка
   * @param retryableErrors Список кодов ошибок, которые можно повторять
   * @returns true если ошибку можно повторять
   */
  private isRetryableError(error: unknown, retryableErrors: number[]): boolean {
    // Сетевые ошибки всегда можно повторять
    if (error instanceof Error && !(error instanceof APIError)) {
      const message = error.message.toLowerCase();
      if (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnreset') ||
        message.includes('enotfound')
      ) {
        return true;
      }
    }

    // Для APIError проверяем код
    if (error instanceof APIError) {
      const errorCode =
        typeof error.code === 'number'
          ? error.code
          : Number.parseInt(String(error.code), 10);
      return !Number.isNaN(errorCode) && retryableErrors.includes(errorCode);
    }

    // По умолчанию не повторяем неизвестные ошибки
    return false;
  }

  /**
   * Задержка на указанное время
   * @param ms Время задержки в миллисекундах
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Получает задержку для следующей попытки с exponential backoff
   * @param attempt Номер попытки (начиная с 1)
   * @param options Опции retry
   * @returns Задержка в миллисекундах
   */
  getRetryDelay(attempt: number, options: RetryOptions = {}): number {
    const initialDelayMs = options.initialDelayMs ?? this.defaultInitialDelayMs;
    const maxDelayMs = options.maxDelayMs ?? this.defaultMaxDelayMs;
    const multiplier = options.multiplier ?? this.defaultMultiplier;

    const delay = initialDelayMs * Math.pow(multiplier, attempt - 1);
    return Math.min(delay, maxDelayMs);
  }
}
