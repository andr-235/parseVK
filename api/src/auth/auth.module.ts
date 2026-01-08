import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import type { AppConfig } from '../config/app.config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const secret = configService.get('jwtAccessSecret', { infer: true });
        if (!secret) {
          throw new Error('JWT access secret is not configured');
        }
        const expiresInMinutes =
          configService.get('jwtAccessExpiresInMinutes', { infer: true }) ?? 15;

        return {
          secret,
          signOptions: {
            expiresIn: `${Math.max(1, expiresInMinutes)}m`,
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const ttl =
          configService.get('authLoginRateLimitTtlSeconds', {
            infer: true,
          }) ?? 60;
        const limit =
          configService.get('authLoginRateLimitMaxAttempts', {
            infer: true,
          }) ?? 5;

        return {
          ttl: Math.max(1, ttl),
          limit: Math.max(1, limit),
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtRefreshGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
