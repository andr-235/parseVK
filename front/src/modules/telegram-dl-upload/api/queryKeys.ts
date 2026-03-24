export const telegramDlUploadQueryKeys = {
  all: ['telegram-dl-upload'] as const,
  files: () => [...telegramDlUploadQueryKeys.all, 'files'] as const,
  contacts: () => [...telegramDlUploadQueryKeys.all, 'contacts'] as const,
  matchRuns: () => [...telegramDlUploadQueryKeys.all, 'match-runs'] as const,
  matchRun: (runId: string) => [...telegramDlUploadQueryKeys.matchRuns(), runId] as const,
  matchResults: (runId: string) =>
    [...telegramDlUploadQueryKeys.matchRun(runId), 'results'] as const,
}
