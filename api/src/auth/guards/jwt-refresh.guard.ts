import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest<TUser = any>(err: unknown, user: unknown): TUser {
    if (err instanceof Error) throw err;
    if (!user) throw new UnauthorizedException(); // без текста, единообразно
    return user as TUser;
  }
}
