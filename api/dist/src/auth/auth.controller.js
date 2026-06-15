var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Public } from './decorators/public.decorator.js';
import { AllowTemporaryPassword } from './decorators/allow-temporary-password.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { RequireUserPipe } from './pipes/require-user.pipe.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { AuthService } from './auth.service.js';
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(dto) {
        return this.authService.login(dto.username, dto.password);
    }
    async refresh(dto, user) {
        return this.authService.refreshTokens(user.id, dto.refreshToken);
    }
    async changePassword(dto, user) {
        return this.authService.changePassword(user.id, dto.oldPassword, dto.newPassword);
    }
};
__decorate([
    Public(),
    UseGuards(ThrottlerGuard),
    Post('login'),
    HttpCode(200),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    Public(),
    UseGuards(JwtRefreshGuard),
    Post('refresh'),
    HttpCode(200),
    __param(0, Body()),
    __param(1, CurrentUser(RequireUserPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RefreshTokenDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    AllowTemporaryPassword(),
    Post('change-password'),
    HttpCode(200),
    __param(0, Body()),
    __param(1, CurrentUser(RequireUserPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
AuthController = __decorate([
    Controller('auth'),
    __metadata("design:paramtypes", [AuthService])
], AuthController);
export { AuthController };
//# sourceMappingURL=auth.controller.js.map