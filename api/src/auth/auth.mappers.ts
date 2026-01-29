import type { AuthenticatedUser } from './auth.types.js';

export const toAuthenticatedUser = (
  user: AuthenticatedUser,
): AuthenticatedUser => ({
  id: user.id,
  username: user.username,
  role: user.role,
  isTemporaryPassword: user.isTemporaryPassword,
});
