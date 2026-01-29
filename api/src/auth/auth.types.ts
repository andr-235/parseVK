import type { UserRole } from '../users/types/user-role.enum.js';
import type { Request } from 'express';

export interface JwtPayload {
  sub: number;
  username: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  role: UserRole;
  isTemporaryPassword: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthenticatedUser;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };
