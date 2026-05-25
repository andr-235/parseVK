export const okFriendsExportQueryKeys = {
  all: ['okFriendsExport'] as const,
  status: () => [...okFriendsExportQueryKeys.all, 'status'] as const,
} as const
