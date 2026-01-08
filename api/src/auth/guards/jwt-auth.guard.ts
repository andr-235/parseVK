import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../auth.constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly publicPaths = new Set([
    '/health',
    '/metrics',
    '/api/health',
    '/api/metrics',
  ]);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (this.isPublicRoute(context)) {
      return true;
    }

    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (this.isPublicPath(request)) {
      return true;
    }

    if (request.method === 'OPTIONS') {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: unknown, user: unknown): unknown {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Unauthorized');
    }

    return user;
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
    const normalizedPath = rawPath.split('?')[0].replace(/\/$/, '');
    return this.publicPaths.has(normalizedPath);
  }
}
