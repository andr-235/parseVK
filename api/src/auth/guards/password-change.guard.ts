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

@Injectable()
export class PasswordChangeGuard implements CanActivate {
  private readonly allowedPaths = new Set([
    '/auth/change-password',
    '/api/auth/change-password',
  ]);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;
    if (isPublic) {
      return true;
    }

    const allowTemporary =
      this.reflector.getAllAndOverride<boolean>(ALLOW_TEMP_PASSWORD_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;
    if (allowTemporary) {
      return true;
    }

    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (request.method === 'OPTIONS') {
      return true;
    }

    if (this.isAllowedPath(request)) {
      return true;
    }

    const user = request.user as AuthenticatedUser | undefined;
    if (!user) {
      return true;
    }

    if (user.isTemporaryPassword) {
      throw new ForbiddenException('Password change required');
    }

    return true;
  }

  private isAllowedPath(request: Request): boolean {
    const rawPath = request.path || request.url || '';
    const normalizedPath = rawPath.split('?')[0].replace(/\/$/, '');
    return this.allowedPaths.has(normalizedPath);
  }
}
