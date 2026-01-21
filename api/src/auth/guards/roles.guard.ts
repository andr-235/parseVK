import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../../users/types/user-role.enum';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../auth.constants';
import type { AuthenticatedRequest } from '../auth.types';
import { getBoolMetadata } from '../auth.utils';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (getBoolMetadata(this.reflector, IS_PUBLIC_KEY, context)) return true;

    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.method === 'OPTIONS') return true;

    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) return true;

    const user = request.user;
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(); // стандартно
    }

    return true;
  }
}
