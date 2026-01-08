import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = any>(
    err: any,
    user: any,
    _info: any,
    _context: ExecutionContext,
    _status?: any,
  ): TUser {
    void _info;
    void _context;
    void _status;
    if (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException('Unauthorized');
    }

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return user as TUser;
  }
}
