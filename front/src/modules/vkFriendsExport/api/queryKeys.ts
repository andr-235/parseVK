export const vkFriendsExportQueryKeys = {
  all: ['vkFriendsExport'] as const,
  status: () => [...vkFriendsExportQueryKeys.all, 'status'] as const,
} as const
