export const telegramQueryKeys = {
  all: ['telegram'] as const,
  session: () => [...telegramQueryKeys.all, 'session'] as const,
  members: () => [...telegramQueryKeys.all, 'members'] as const,
  sync: () => [...telegramQueryKeys.all, 'sync'] as const,
} as const
