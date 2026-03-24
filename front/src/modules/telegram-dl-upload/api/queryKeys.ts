export const telegramDlUploadQueryKeys = {
  all: ['telegram-dl-upload'] as const,
  files: () => [...telegramDlUploadQueryKeys.all, 'files'] as const,
  contacts: () => [...telegramDlUploadQueryKeys.all, 'contacts'] as const,
}
