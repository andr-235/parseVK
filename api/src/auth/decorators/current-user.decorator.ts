import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, AuthenticatedUser } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | null => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return req.user ?? null;
  },
);
