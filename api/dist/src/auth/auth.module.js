var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
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
let AuthModule = class AuthModule {
};
AuthModule = __decorate([
    Module({
        imports: [
            UsersModule,
            PassportModule,
            JwtModule.registerAsync({
                inject: [ConfigService],
                useFactory: (cs) => jwtAccessConfigFactory(cs),
            }),
            ThrottlerModule.forRootAsync({
                inject: [ConfigService],
                useFactory: (cs) => authThrottlerConfigFactory(cs),
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
            JwtModule,
        ],
    })
], AuthModule);
export { AuthModule };
//# sourceMappingURL=auth.module.js.map