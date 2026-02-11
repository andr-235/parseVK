import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { AppConfig } from '../../config/app.config.js';
import { UsersService } from '../../users/users.service.js';
import type { AuthenticatedUser, JwtPayload } from '../auth.types.js';
import { toAuthenticatedUser } from '../auth.mappers.js';
import { getUserOrThrow } from '../auth.helpers.js';
import { refreshTokenExtractor } from './refresh-token.extractor.js';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService<AppConfig>,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get('jwtRefreshSecret', { infer: true });
    if (!secret) throw new Error('JWT access secret is not configured');

    super({
      // [FIX] использует кастомный экстрактор: cookie → x-refresh-token header → body
      // ранее использовался fromAuthHeaderAsBearerToken(), который не находил токен
      // т.к. фронтенд отправляет его в теле запроса
      jwtFromRequest: refreshTokenExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await getUserOrThrow(
      this.usersService,
      payload.sub.toString(),
    );
    return toAuthenticatedUser(user);
  }
}
