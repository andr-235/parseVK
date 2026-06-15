import type { UsersService } from '../users/users.service.js';
import type { AuthenticatedUser } from './auth.types.js';
export declare function getUserOrThrow(usersService: UsersService, userId: string): Promise<AuthenticatedUser>;
