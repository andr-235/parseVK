import type { UserRole } from './user-role.enum';

export type UserAuthRecord = {
  id: number;
  username: string;
  role: UserRole;
  passwordHash: string;
  refreshTokenHash: string | null;
  isTemporaryPassword: boolean;
};

export type UserRecord = UserAuthRecord & {
  createdAt: Date;
  updatedAt: Date;
};
