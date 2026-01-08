import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: unknown, user: unknown): unknown {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Unauthorized');
    }

    return user;
  }
}
