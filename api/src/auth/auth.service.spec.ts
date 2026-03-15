import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import type { UserAuthRecord } from '../users/types/user.types.js';

vi.mock('./password-hash.js', () => ({
  hashSecret: vi.fn((value: string) => Promise.resolve(`hashed:${value}`)),
  verifyAndMaybeRehash: vi.fn((secret: string, storedHash: string) =>
    Promise.resolve({
      ok: secret === storedHash,
    }),
  ),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let user: UserAuthRecord;
  let usersService: {
    findByUsername: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    updateRefreshTokenHash: ReturnType<typeof vi.fn>;
    setRefreshTokenHash: ReturnType<typeof vi.fn>;
    setPassword: ReturnType<typeof vi.fn>;
  };
  let jwtService: {
    signAsync: ReturnType<typeof vi.fn>;
  };
  let configService: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    user = {
      id: 1,
      username: 'admin',
      role: 'admin',
      passwordHash: 'password',
      refreshTokenHash: null,
      isTemporaryPassword: false,
    };

    usersService = {
      findByUsername: vi.fn((username: string) =>
        Promise.resolve(username === user.username ? { ...user } : null),
      ),
      findById: vi.fn((id: number) =>
        Promise.resolve(id === user.id ? { ...user } : null),
      ),
      updateRefreshTokenHash: vi.fn(
        (userId: number, refreshToken: string | null) => {
          if (userId === user.id) {
            user.refreshTokenHash = refreshToken;
          }
          return Promise.resolve();
        },
      ),
      setRefreshTokenHash: vi.fn(
        (userId: number, refreshTokenHash: string | null) => {
          if (userId === user.id) {
            user.refreshTokenHash = refreshTokenHash;
          }
          return Promise.resolve();
        },
      ),
      setPassword: vi.fn(),
    };

    let accessCounter = 0;
    let refreshCounter = 0;
    jwtService = {
      signAsync: vi.fn(
        (_payload: unknown, options?: { expiresIn?: string }) => {
          if (options?.expiresIn?.endsWith('m')) {
            accessCounter += 1;
            return Promise.resolve(`access-token-${accessCounter}`);
          }

          refreshCounter += 1;
          return Promise.resolve(`refresh-token-${refreshCounter}`);
        },
      ),
    };

    configService = {
      get: vi.fn((key: string) => {
        if (key === 'jwtAccessSecret') return 'access-secret';
        if (key === 'jwtRefreshSecret') return 'refresh-secret';
        if (key === 'jwtAccessExpiresInMinutes') return 15;
        if (key === 'jwtRefreshExpiresInDays') return 7;
        return undefined;
      }),
    };

    authService = new AuthService(
      usersService as never,
      jwtService as never,
      configService as never,
    );
  });

  it('rejects an outdated refresh token after successful rotation', async () => {
    const firstLogin = await authService.login('admin', 'password');
    const secondLogin = await authService.refreshTokens(
      user.id,
      firstLogin.refreshToken,
    );

    await expect(
      authService.refreshTokens(user.id, firstLogin.refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(secondLogin.accessToken).toBe('access-token-2');
    expect(secondLogin.refreshToken).toBe('refresh-token-2');
    expect(user.refreshTokenHash).toBe('refresh-token-2');
  });

  it('accepts the most recently issued refresh token', async () => {
    const firstLogin = await authService.login('admin', 'password');
    const secondLogin = await authService.refreshTokens(
      user.id,
      firstLogin.refreshToken,
    );
    const thirdLogin = await authService.refreshTokens(
      user.id,
      secondLogin.refreshToken,
    );

    expect(thirdLogin.accessToken).toBe('access-token-3');
    expect(thirdLogin.refreshToken).toBe('refresh-token-3');
    expect(user.refreshTokenHash).toBe('refresh-token-3');
  });
});
