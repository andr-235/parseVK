import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth.types';
import { ALLOW_TEMP_PASSWORD_KEY, IS_PUBLIC_KEY } from '../auth.constants';
import { getBoolMetadata } from '../auth.utils';

@Injectable()
export class PasswordChangeGuard implements CanActivate {
  private static readonly allowedPaths = new Set([
    '/auth/change-password',
    '/api/auth/change-password',
  ]);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1) Public routes — always allowed
    if (getBoolMetadata(this.reflector, IS_PUBLIC_KEY, context)) return true;

    // 2) Explicit allow for temporary password users
    if (getBoolMetadata(this.reflector, ALLOW_TEMP_PASSWORD_KEY, context))
      return true;

    // 3) Non-HTTP contexts — do not block
    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest<Request>();

    // 4) CORS preflight — allow
    if (request.method === 'OPTIONS') return true;

    // 5) Allow the change-password endpoint itself
    if (this.isAllowedPath(request)) return true;

    // 6) If user not set (e.g., route is public or auth guard didn't run) — don't block here
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) return true;

    // 7) Block if temporary password is still active
    if (user.isTemporaryPassword) {
      throw new ForbiddenException('Password change required');
    }

    return true;
  }

  private isAllowedPath(request: Request): boolean {
    const rawPath = request.path || request.url || '';
    const normalizedPath = rawPath.split('?')[0].replace(/\/$/, '');
    return PasswordChangeGuard.allowedPaths.has(normalizedPath);
  }
}
