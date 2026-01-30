export const keywordsQueryKeys = {
  all: ['keywords'] as const,
  list: () => [...keywordsQueryKeys.all, 'list'] as const,
} as const
