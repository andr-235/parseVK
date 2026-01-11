import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class AppConfig {
  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  port?: number = 3000;

  @IsString()
  @IsOptional()
  databaseUrl?: string;

  @IsString()
  @IsOptional()
  redisHost?: string = 'redis';

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  redisPort?: number = 6379;

  @IsString()
  @IsOptional()
  bullMqHost?: string = 'redis';

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  bullMqPort?: number = 6379;

  @IsString()
  @IsOptional()
  bullMqPrefix?: string;

  @IsNumber()
  @IsOptional()
  telegramApiId?: number;

  @IsString()
  @IsOptional()
  telegramApiHash?: string;

  @IsString()
  @IsOptional()
  telegramSession?: string;

  @IsString()
  vkToken!: string;

  @IsNumber()
  @Min(1000)
  @IsOptional()
  vkApiTimeoutMs?: number = 30000;

  @IsString()
  @IsOptional()
  imageModerationWebhookUrl?: string;

  @IsString()
  @IsOptional()
  imageModerationAllowSelfSigned?: string;

  @IsNumber()
  @Min(1000)
  @IsOptional()
  imageModerationTimeoutMs?: number;

  @IsString()
  @IsOptional()
  corsOrigins?: string = 'http://192.168.88.12:8080';

  @IsString()
  @IsOptional()
  corsCredentialsOrigins?: string;

  @IsString()
  @IsOptional()
  corsCredentialsRoutes?: string;

  @IsString()
  jwtAccessSecret!: string;

  @IsString()
  jwtRefreshSecret!: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  jwtAccessExpiresInMinutes?: number = 15;

  @IsNumber()
  @Min(1)
  @IsOptional()
  jwtRefreshExpiresInDays?: number = 7;

  @IsNumber()
  @Min(1)
  @IsOptional()
  authLoginRateLimitTtlSeconds?: number = 60;

  @IsNumber()
  @Min(1)
  @IsOptional()
  authLoginRateLimitMaxAttempts?: number = 5;

  // VK API Request Manager configuration
  @IsNumber()
  @Min(1)
  @IsOptional()
  vkApiRateLimitRequests?: number = 3; // requests per second

  @IsNumber()
  @Min(1000)
  @IsOptional()
  vkApiRateLimitWindowMs?: number = 1000; // 1 second window

  @IsNumber()
  @Min(0)
  @IsOptional()
  vkApiRetryMaxAttempts?: number = 2;

  @IsNumber()
  @Min(100)
  @IsOptional()
  vkApiRetryInitialDelayMs?: number = 500;

  @IsNumber()
  @Min(1)
  @IsOptional()
  vkApiRetryMaxDelayMs?: number = 2000;

  @IsNumber()
  @Min(0)
  @IsOptional()
  vkApiRetryMultiplier?: number = 2;

  @IsNumber()
  @Min(0)
  @IsOptional()
  vkApiCircuitBreakerFailureThreshold?: number = 5;

  @IsNumber()
  @Min(1000)
  @IsOptional()
  vkApiCircuitBreakerResetTimeoutMs?: number = 60000; // 1 minute

  @IsNumber()
  @Min(0)
  @IsOptional()
  vkApiCircuitBreakerHalfOpenMaxCalls?: number = 3;
}
