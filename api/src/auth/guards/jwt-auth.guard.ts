import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, PUBLIC_PATHS } from '../auth.constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (this.isPublicRoute(context)) return true;

    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest<Request>();

    if (request.method === 'OPTIONS') return true;

    if (this.isPublicPath(request)) return true;

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: unknown, user: unknown): TUser {
    if (err instanceof Error) throw err;

    if (!user) throw new UnauthorizedException(); // единообразно

    return user as TUser;
  }

  private isPublicRoute(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }

  private isPublicPath(request: Request): boolean {
    const rawPath = request.path || request.url || '';
    // убираем query и trailing slash
    const normalizedPath = rawPath.split('?')[0].replace(/\/$/, '');
    return PUBLIC_PATHS.includes(normalizedPath);
  }
}
