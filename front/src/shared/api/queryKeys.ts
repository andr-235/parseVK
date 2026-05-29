export const queryKeys = {
  auth: ['auth'] as const,
  currentUser: () => [...queryKeys.auth, 'currentUser'] as const,
} as const
