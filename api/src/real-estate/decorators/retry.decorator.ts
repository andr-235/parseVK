import { Injectable, Logger } from '@nestjs/common';
import { SCRAPING_CONFIG } from '../config/scraping.config';

export interface IRetryable {
  execute(): Promise<any>;
}

export interface IRetryConfig {
  maxRetries: number;
  baseDelay: number;
  backoffMultiplier: number;
}

@Injectable()
export class RetryDecorator implements IRetryable {
  private readonly logger = new Logger(RetryDecorator.name);

  constructor(
    private readonly decorated: IRetryable,
    private readonly config: IRetryConfig = {
      maxRetries: SCRAPING_CONFIG.defaults.fetchMaxRetries,
      baseDelay: SCRAPING_CONFIG.defaults.rateLimitBaseDelayMs,
      backoffMultiplier: SCRAPING_CONFIG.defaults.captchaBackoffMultiplier,
    },
  ) {}

  async execute(): Promise<any> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt += 1) {
      try {
        return await this.decorated.execute();
      } catch (error) {
        lastError = error;

        if (this.isRetryableError(error) && attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt, error);
          this.logger.warn(
            `Попытка ${attempt}/${this.config.maxRetries} не удалась, повтор через ${delay}мс: ${error.message}`,
          );
          await this.delay(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Неизвестная ошибка при выполнении операции');
  }

  private isRetryableError(error: unknown): boolean {
    // Проверяем, является ли ошибка связанной с rate limiting или сетевыми проблемами
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('rate limit') ||
             message.includes('captcha') ||
             message.includes('timeout') ||
             message.includes('network');
    }
    return false;
  }

  private calculateDelay(attempt: number, error: unknown): number {
    const baseDelay = this.config.baseDelay * attempt;
    const isCaptcha = error instanceof Error &&
                      error.message.toLowerCase().includes('captcha');

    return isCaptcha ? baseDelay * this.config.backoffMultiplier : baseDelay;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function withRetry(config?: Partial<IRetryConfig>) {
  return function <T extends new (...args: any[]) => IRetryable>(
    target: T,
  ): T {
    return class extends target {
      execute() {
        const fullConfig = config ? { ...this.getDefaultConfig(), ...config } : this.getDefaultConfig();
        const decorator = new RetryDecorator(this, fullConfig);
        return decorator.execute();
      }

      private getDefaultConfig(): IRetryConfig {
        return {
          maxRetries: SCRAPING_CONFIG.defaults.fetchMaxRetries,
          baseDelay: SCRAPING_CONFIG.defaults.rateLimitBaseDelayMs,
          backoffMultiplier: SCRAPING_CONFIG.defaults.captchaBackoffMultiplier,
        };
      }
    } as T;
  };
}