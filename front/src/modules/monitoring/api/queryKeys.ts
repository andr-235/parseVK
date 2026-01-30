export const monitoringQueryKeys = {
  all: ['monitoring'] as const,
  messages: () => [...monitoringQueryKeys.all, 'messages'] as const,
  groups: () => [...monitoringQueryKeys.all, 'groups'] as const,
} as const
