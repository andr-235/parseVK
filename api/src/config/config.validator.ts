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
      : 60000,
    imageModerationWebhookUrl: config.IMAGE_MODERATION_WEBHOOK_URL,
    imageModerationAllowSelfSigned: config.IMAGE_MODERATION_ALLOW_SELF_SIGNED,
    imageModerationTimeoutMs: config.IMAGE_MODERATION_TIMEOUT_MS
      ? parseInt(config.IMAGE_MODERATION_TIMEOUT_MS as string, 10)
      : undefined,
    corsOrigins: config.CORS_ORIGINS || 'http://localhost:8080,http://localhost:3000',
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`Configuration validation failed: ${errorMessages}`);
  }

  return validatedConfig;
}

