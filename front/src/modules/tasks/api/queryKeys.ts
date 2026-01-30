export const tasksQueryKeys = {
  all: ['tasks'] as const,
  list: () => [...tasksQueryKeys.all, 'list'] as const,
  byId: (id: number) => [...tasksQueryKeys.all, 'byId', id] as const,
  active: () => [...tasksQueryKeys.all, 'active'] as const,
} as const
