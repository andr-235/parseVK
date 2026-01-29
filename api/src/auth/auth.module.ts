import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from '../config/app.config.js';
import { UsersModule } from '../users/users.module.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

import { JwtAccessStrategy } from './strategies/jwt-access.strategy.js';

import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PasswordChangeGuard } from './guards/password-change.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { jwtAccessConfigFactory } from './strategies/config/jwt.config.js';
import { authThrottlerConfigFactory } from './strategies/config/throttler.config.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService<AppConfig>) => jwtAccessConfigFactory(cs),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService<AppConfig>) =>
        authThrottlerConfigFactory(cs),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PasswordChangeGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [
    AuthService,
    JwtModule, // если токены подписываются в других модулях
  ],
})
export class AuthModule {}
