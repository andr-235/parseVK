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
  vkToken!: string;

  @IsNumber()
  @Min(1000)
  @IsOptional()
  vkApiTimeoutMs?: number = 60000;

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
  corsOrigins?: string = 'http://localhost:8080,http://localhost:3000';
}

