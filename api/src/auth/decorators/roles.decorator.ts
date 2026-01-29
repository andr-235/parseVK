import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../users/types/user-role.enum.js';
import { ROLES_KEY } from '../auth.constants.js';

export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
