import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = any>(err: unknown, user: unknown): TUser {
    if (err instanceof Error) throw err;
    if (!user) throw new UnauthorizedException(); // без текста, единообразно
    return user as TUser;
  }
}
