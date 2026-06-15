import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AppConfig } from '../config/app.config.js';
import { UsersService } from '../users/users.service.js';
import type { AuthResponse } from './auth.types.js';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService<AppConfig>);
    login(username: string, password: string): Promise<AuthResponse>;
    refreshTokens(userId: number, refreshToken: string): Promise<AuthResponse>;
    changePassword(userId: number, oldPassword: string, newPassword: string): Promise<AuthResponse>;
    private validateUser;
    private validateRefreshToken;
    private issueAndStoreTokens;
    private issueTokens;
    private buildAuthResponse;
    private getAccessSecret;
    private getRefreshSecret;
    private getAccessTokenTtlMinutes;
    private getRefreshTokenTtlDays;
}
