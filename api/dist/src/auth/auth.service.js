var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable, UnauthorizedException, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hashSecret, verifyAndMaybeRehash } from './password-hash.js';
import { UsersService } from '../users/users.service.js';
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async login(username, password) {
        const user = await this.validateUser(username, password);
        const tokens = await this.issueAndStoreTokens(user);
        return this.buildAuthResponse(user, tokens);
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.validateRefreshToken(userId, refreshToken);
        const tokens = await this.issueAndStoreTokens(user);
        return this.buildAuthResponse(user, tokens);
    }
    async changePassword(userId, oldPassword, newPassword) {
        if (oldPassword === newPassword) {
            throw new BadRequestException('New password must differ from old password');
        }
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }
        const { ok } = await verifyAndMaybeRehash(oldPassword, user.passwordHash);
        if (!ok) {
            throw new BadRequestException('Invalid current password');
        }
        const passwordHash = await hashSecret(newPassword);
        const updatedUser = await this.usersService.setPassword(user.id, passwordHash, false);
        const tokens = await this.issueAndStoreTokens(updatedUser);
        return this.buildAuthResponse(updatedUser, tokens);
    }
    async validateUser(username, password) {
        const user = await this.usersService.findByUsername(username);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const { ok, newHash } = await verifyAndMaybeRehash(password, user.passwordHash);
        if (!ok) {
            throw new UnauthorizedException('Invalid credentials');
        }
        if (newHash) {
            const updatedUser = await this.usersService.setPassword(user.id, newHash, user.isTemporaryPassword);
            return updatedUser;
        }
        return user;
    }
    async validateRefreshToken(userId, refreshToken) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshTokenHash) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        const { ok, newHash } = await verifyAndMaybeRehash(refreshToken, user.refreshTokenHash);
        if (!ok) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        if (newHash) {
            await this.usersService.setRefreshTokenHash(user.id, newHash);
            return { ...user, refreshTokenHash: newHash };
        }
        return user;
    }
    async issueAndStoreTokens(user) {
        const tokens = await this.issueTokens(user);
        await this.usersService.updateRefreshTokenHash(user.id, tokens.refreshToken);
        return tokens;
    }
    async issueTokens(user) {
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
        };
        const accessSecret = this.getAccessSecret();
        const refreshSecret = this.getRefreshSecret();
        const accessExpiresInMinutes = this.getAccessTokenTtlMinutes();
        const refreshExpiresInDays = this.getRefreshTokenTtlDays();
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: accessSecret,
                expiresIn: `${accessExpiresInMinutes}m`,
            }),
            this.jwtService.signAsync(payload, {
                secret: refreshSecret,
                expiresIn: `${refreshExpiresInDays}d`,
            }),
        ]);
        return { accessToken, refreshToken };
    }
    buildAuthResponse(user, tokens) {
        return {
            ...tokens,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                isTemporaryPassword: user.isTemporaryPassword,
            },
        };
    }
    getAccessSecret() {
        const secret = this.configService.get('jwtAccessSecret', { infer: true });
        if (!secret) {
            throw new Error('JWT access secret is not configured');
        }
        return secret;
    }
    getRefreshSecret() {
        const secret = this.configService.get('jwtRefreshSecret', { infer: true });
        if (!secret) {
            throw new Error('JWT refresh secret is not configured');
        }
        return secret;
    }
    getAccessTokenTtlMinutes() {
        const ttl = this.configService.get('jwtAccessExpiresInMinutes', { infer: true }) ??
            15;
        return Math.max(1, ttl);
    }
    getRefreshTokenTtlDays() {
        const ttl = this.configService.get('jwtRefreshExpiresInDays', { infer: true }) ?? 7;
        return Math.max(1, ttl);
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UsersService,
        JwtService,
        ConfigService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map