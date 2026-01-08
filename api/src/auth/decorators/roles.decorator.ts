import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../auth.constants';

export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
