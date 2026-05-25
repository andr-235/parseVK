export const authorAnalysisQueryKeys = {
  all: ['authorAnalysis'] as const,
  byAuthor: (vkUserId: number | string) =>
    [...authorAnalysisQueryKeys.all, 'byAuthor', vkUserId] as const,
  photos: (vkUserId: number | string) =>
    [...authorAnalysisQueryKeys.all, 'photos', vkUserId] as const,
} as const
