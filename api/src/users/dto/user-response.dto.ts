import type { UserRole } from '../types/user-role.enum.js';

export class UserResponseDto {
  id!: number;
  username!: string;
  role!: UserRole;
  isTemporaryPassword!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
