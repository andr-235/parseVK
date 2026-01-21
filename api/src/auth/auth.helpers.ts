import { UnauthorizedException } from '@nestjs/common';
import type { UsersService } from '../users/users.service';
import type { AuthenticatedUser } from './auth.types';

export async function getUserOrThrow(
  usersService: UsersService,
  userId: string,
): Promise<AuthenticatedUser> {
  const user = await usersService.findById(Number(userId));
  if (!user) throw new UnauthorizedException(); // без текста — стандартно
  return user;
}
