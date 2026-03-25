import type { TelegramDlImportContactsQuery } from './telegramDlUpload.api'

export const telegramDlUploadQueryKeys = {
  all: ['telegram-dl-upload'] as const,
  files: () => [...telegramDlUploadQueryKeys.all, 'files'] as const,
  contacts: (params?: TelegramDlImportContactsQuery) =>
    [...telegramDlUploadQueryKeys.all, 'contacts', params ?? {}] as const,
  matchRuns: () => [...telegramDlUploadQueryKeys.all, 'match-runs'] as const,
  matchRun: (runId: string) => [...telegramDlUploadQueryKeys.matchRuns(), runId] as const,
  matchResults: (runId: string) =>
    [...telegramDlUploadQueryKeys.matchRun(runId), 'results'] as const,
  matchResultMessages: (runId: string, resultId: string) =>
    [...telegramDlUploadQueryKeys.matchResults(runId), resultId, 'messages'] as const,
}
