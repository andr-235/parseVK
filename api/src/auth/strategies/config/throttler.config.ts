import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../config/app.config.js';

export function authThrottlerConfigFactory(
  configService: ConfigService<AppConfig>,
) {
  const ttl =
    configService.get('authLoginRateLimitTtlSeconds', { infer: true }) ?? 60;
  const limit =
    configService.get('authLoginRateLimitMaxAttempts', { infer: true }) ?? 5;

  return [{ ttl: Math.max(1, ttl), limit: Math.max(1, limit) }];
}
