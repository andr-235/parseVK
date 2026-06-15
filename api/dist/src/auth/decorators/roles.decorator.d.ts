import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../users/types/user-role.enum.js';
export declare const Roles: (...roles: UserRole[]) => ReturnType<typeof SetMetadata>;
