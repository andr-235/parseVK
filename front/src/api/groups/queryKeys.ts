export const groupsQueryKeys = {
  all: ['groups'] as const,
  list: () => [...groupsQueryKeys.all, 'list'] as const,
} as const
