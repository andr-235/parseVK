export const settingsQueryKeys = {
  all: ['settings'] as const,
  taskAutomation: () => [...settingsQueryKeys.all, 'taskAutomation'] as const,
} as const
