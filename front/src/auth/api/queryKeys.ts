const authKeys = ['auth'] as const

export const authQueryKeys = {
  all: authKeys,
  currentUser: () => [...authKeys, 'currentUser'] as const,
} as const
