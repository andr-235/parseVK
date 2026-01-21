import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { AppConfig } from '../config/app.config';
import { UsersService } from '../users/users.service';
import type { UserAuthRecord } from '../users/types/user.types';
import type { AuthResponse, AuthTokens, JwtPayload } from './auth.types';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async login(username: string, password: string): Promise<AuthResponse> {
    const user = await this.validateUser(username, password);
    const tokens = await this.issueAndStoreTokens(user);
    return this.buildAuthResponse(user, tokens);
  }

  async refreshTokens(
    userId: number,
    refreshToken: string,
  ): Promise<AuthResponse> {
    const user = await this.validateRefreshToken(userId, refreshToken);
    const tokens = await this.issueAndStoreTokens(user);
    return this.buildAuthResponse(user, tokens);
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<AuthResponse> {
    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'New password must differ from old password',
      );
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const matches = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestException('Invalid current password');
    }

    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    const updatedUser = await this.usersService.setPassword(
      user.id,
      passwordHash,
      false,
    );

    const tokens = await this.issueAndStoreTokens(updatedUser);
    return this.buildAuthResponse(updatedUser, tokens);
  }

  private async validateUser(
    username: string,
    password: string,
  ): Promise<UserAuthRecord> {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async validateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<UserAuthRecord> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return user;
  }

  private async issueAndStoreTokens(user: UserAuthRecord): Promise<AuthTokens> {
    const tokens = await this.issueTokens(user);
    await this.usersService.updateRefreshTokenHash(
      user.id,
      tokens.refreshToken,
    );
    return tokens;
  }

  private async issueTokens(user: UserAuthRecord): Promise<AuthTokens> {
    const payload: JwtPayload = {
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

  private buildAuthResponse(
    user: UserAuthRecord,
    tokens: AuthTokens,
  ): AuthResponse {
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

  private getAccessSecret(): string {
    const secret = this.configService.get('jwtAccessSecret', { infer: true });
    if (!secret) {
      throw new Error('JWT access secret is not configured');
    }
    return secret;
  }

  private getRefreshSecret(): string {
    const secret = this.configService.get('jwtRefreshSecret', { infer: true });
    if (!secret) {
      throw new Error('JWT refresh secret is not configured');
    }
    return secret;
  }

  private getAccessTokenTtlMinutes(): number {
    const ttl =
      this.configService.get('jwtAccessExpiresInMinutes', { infer: true }) ??
      15;
    return Math.max(1, ttl);
  }

  private getRefreshTokenTtlDays(): number {
    const ttl =
      this.configService.get('jwtRefreshExpiresInDays', { infer: true }) ?? 7;
    return Math.max(1, ttl);
  }
}
