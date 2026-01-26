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
    bullMqHost: config.BULLMQ_HOST || config.REDIS_HOST || 'redis',
    bullMqPort: config.BULLMQ_PORT
      ? parseInt(config.BULLMQ_PORT as string, 10)
      : config.REDIS_PORT
        ? parseInt(config.REDIS_PORT as string, 10)
        : 6379,
    bullMqPrefix: config.BULLMQ_PREFIX,
    telegramApiId: config.TELEGRAM_API_ID
      ? parseInt(config.TELEGRAM_API_ID as string, 10)
      : undefined,
    telegramApiHash: config.TELEGRAM_API_HASH,
    telegramSession: config.TELEGRAM_SESSION,
    vkToken: config.VK_TOKEN,
    vkApiTimeoutMs: config.VK_API_TIMEOUT_MS
      ? parseInt(config.VK_API_TIMEOUT_MS as string, 10)
      : 30000,
    imageModerationWebhookUrl: config.IMAGE_MODERATION_WEBHOOK_URL,
    imageModerationAllowSelfSigned: config.IMAGE_MODERATION_ALLOW_SELF_SIGNED,
    imageModerationTimeoutMs: config.IMAGE_MODERATION_TIMEOUT_MS
      ? parseInt(config.IMAGE_MODERATION_TIMEOUT_MS as string, 10)
      : undefined,
    corsOrigins: config.CORS_ORIGINS || 'http://192.168.88.12:8080',
    corsCredentialsOrigins: config.CORS_CREDENTIALS_ORIGINS || '',
    corsCredentialsRoutes: config.CORS_CREDENTIALS_ROUTES || '',
    jwtAccessSecret: config.JWT_ACCESS_SECRET,
    jwtRefreshSecret: config.JWT_REFRESH_SECRET,
    jwtAccessExpiresInMinutes: config.JWT_ACCESS_EXPIRES_IN_MINUTES
      ? parseInt(config.JWT_ACCESS_EXPIRES_IN_MINUTES as string, 10)
      : 15,
    jwtRefreshExpiresInDays: config.JWT_REFRESH_EXPIRES_IN_DAYS
      ? parseInt(config.JWT_REFRESH_EXPIRES_IN_DAYS as string, 10)
      : 7,
    authLoginRateLimitTtlSeconds: config.AUTH_LOGIN_RATE_LIMIT_TTL_SECONDS
      ? parseInt(config.AUTH_LOGIN_RATE_LIMIT_TTL_SECONDS as string, 10)
      : 60,
    authLoginRateLimitMaxAttempts: config.AUTH_LOGIN_RATE_LIMIT_MAX_ATTEMPTS
      ? parseInt(config.AUTH_LOGIN_RATE_LIMIT_MAX_ATTEMPTS as string, 10)
      : 5,
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
    monitorDatabaseUrl: config.MONITOR_DATABASE_URL,
    monitorMessagesTable: config.MONITOR_MESSAGES_TABLE || 'messages',
    monitorMessageIdColumn: config.MONITOR_MESSAGE_ID_COLUMN || 'id',
    monitorMessageTextColumn: config.MONITOR_MESSAGE_TEXT_COLUMN || 'text',
    monitorMessageCreatedAtColumn:
      config.MONITOR_MESSAGE_CREATED_AT_COLUMN || 'created_at',
    monitorMessageAuthorColumn: config.MONITOR_MESSAGE_AUTHOR_COLUMN,
    monitorMessageChatColumn: config.MONITOR_MESSAGE_CHAT_COLUMN,
    monitorMessageMetadataColumn:
      config.MONITOR_MESSAGE_METADATA_COLUMN || 'metadata',
    monitorGroupsTable: config.MONITOR_GROUPS_TABLE,
    monitorGroupChatIdColumn: config.MONITOR_GROUP_CHAT_ID_COLUMN,
    monitorGroupNameColumn: config.MONITOR_GROUP_NAME_COLUMN,
    monitorKeywordsTable: config.MONITOR_KEYWORDS_TABLE,
    monitorKeywordWordColumn: config.MONITOR_KEYWORD_WORD_COLUMN,
    okAccessToken: config.OK_ACCESS_TOKEN,
    okApplicationKey: config.OK_APPLICATION_KEY,
    okApplicationSecretKey: config.OK_APPLICATION_SECRET_KEY,
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

  if (!validatedConfig.jwtAccessSecret) {
    throw new Error(
      'JWT_ACCESS_SECRET обязателен для работы приложения. Установите переменную окружения JWT_ACCESS_SECRET.',
    );
  }

  if (!validatedConfig.jwtRefreshSecret) {
    throw new Error(
      'JWT_REFRESH_SECRET обязателен для работы приложения. Установите переменную окружения JWT_REFRESH_SECRET.',
    );
  }

  return validatedConfig;
}
