import type { UserRole } from '@prisma/client';

export class UserResponseDto {
  id!: number;
  username!: string;
  role!: UserRole;
  createdAt!: Date;
  updatedAt!: Date;
}
