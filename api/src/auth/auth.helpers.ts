import { UnauthorizedException } from '@nestjs/common';
import type { UsersService } from '../users/users.service.js';
import type { AuthenticatedUser } from './auth.types.js';

export async function getUserOrThrow(
  usersService: UsersService,
  userId: string,
): Promise<AuthenticatedUser> {
  const user = await usersService.findById(Number(userId));
  if (!user) throw new UnauthorizedException(); // без текста — стандартно
  return user;
}
