import type { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../config/app.config';

export function jwtAccessConfigFactory(
  configService: ConfigService<AppConfig>,
): JwtModuleOptions {
  const secret = configService.get('jwtAccessSecret', { infer: true });
  if (!secret) throw new Error('JWT access secret is not configured');

  const expiresInMinutes =
    configService.get('jwtAccessExpiresInMinutes', { infer: true }) ?? 15;

  const expiresInSeconds = Math.max(1, expiresInMinutes) * 60;

  return {
    secret,
    signOptions: {
      expiresIn: expiresInSeconds, // ✅ number
    },
  };
}
