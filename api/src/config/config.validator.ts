import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AppConfig } from './app.config';

export function validate(config: Record<string, unknown>): AppConfig {
  const validatedConfig = plainToInstance(AppConfig, {
    port: config.PORT ? parseInt(config.PORT as string, 10) : 3000,
    databaseUrl: config.DATABASE_URL,
    redisHost: config.REDIS_HOST || 'redis',
    redisPort: config.REDIS_PORT
      ? parseInt(config.REDIS_PORT as string, 10)
      : 6379,
    vkToken: config.VK_TOKEN,
    vkApiTimeoutMs: config.VK_API_TIMEOUT_MS
      ? parseInt(config.VK_API_TIMEOUT_MS as string, 10)
      : 30000,
    imageModerationWebhookUrl: config.IMAGE_MODERATION_WEBHOOK_URL,
    imageModerationAllowSelfSigned: config.IMAGE_MODERATION_ALLOW_SELF_SIGNED,
    imageModerationTimeoutMs: config.IMAGE_MODERATION_TIMEOUT_MS
      ? parseInt(config.IMAGE_MODERATION_TIMEOUT_MS as string, 10)
      : undefined,
    corsOrigins:
      config.CORS_ORIGINS || 'http://localhost:8080,http://localhost:3000',
    vkApiRateLimitRequests: config.VK_API_RATE_LIMIT_REQUESTS
      ? parseInt(config.VK_API_RATE_LIMIT_REQUESTS as string, 10)
      : 3,
    vkApiRateLimitWindowMs: config.VK_API_RATE_LIMIT_WINDOW_MS
      ? parseInt(config.VK_API_RATE_LIMIT_WINDOW_MS as string, 10)
      : 1000,
    vkApiRetryMaxAttempts: config.VK_API_RETRY_MAX_ATTEMPTS
      ? parseInt(config.VK_API_RETRY_MAX_ATTEMPTS as string, 10)
      : 2,
    vkApiRetryInitialDelayMs: config.VK_API_RETRY_INITIAL_DELAY_MS
      ? parseInt(config.VK_API_RETRY_INITIAL_DELAY_MS as string, 10)
      : 500,
    vkApiRetryMaxDelayMs: config.VK_API_RETRY_MAX_DELAY_MS
      ? parseInt(config.VK_API_RETRY_MAX_DELAY_MS as string, 10)
      : 2000,
    vkApiRetryMultiplier: config.VK_API_RETRY_MULTIPLIER
      ? parseFloat(config.VK_API_RETRY_MULTIPLIER as string)
      : 2,
    vkApiCircuitBreakerFailureThreshold:
      config.VK_API_CIRCUIT_BREAKER_FAILURE_THRESHOLD
        ? parseInt(
            config.VK_API_CIRCUIT_BREAKER_FAILURE_THRESHOLD as string,
            10,
          )
        : 5,
    vkApiCircuitBreakerResetTimeoutMs:
      config.VK_API_CIRCUIT_BREAKER_RESET_TIMEOUT_MS
        ? parseInt(config.VK_API_CIRCUIT_BREAKER_RESET_TIMEOUT_MS as string, 10)
        : 60000,
    vkApiCircuitBreakerHalfOpenMaxCalls:
      config.VK_API_CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS
        ? parseInt(
            config.VK_API_CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS as string,
            10,
          )
        : 3,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const property = error.property;
        const constraints = Object.values(error.constraints || {}).join(', ');
        return `${property}: ${constraints}`;
      })
      .join('; ');
    throw new Error(
      `Ошибка валидации конфигурации: ${errorMessages}. Проверьте переменные окружения.`,
    );
  }

  // Дополнительная проверка обязательных полей
  if (!validatedConfig.vkToken) {
    throw new Error(
      'VK_TOKEN обязателен для работы приложения. Установите переменную окружения VK_TOKEN.',
    );
  }

  return validatedConfig;
}
