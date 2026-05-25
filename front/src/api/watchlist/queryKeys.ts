const watchlistBase = ['watchlist'] as const

export const watchlistQueryKeys = {
  all: watchlistBase,
  authors: () => [...watchlistBase, 'authors'] as const,
  settings: () => [...watchlistBase, 'settings'] as const,
  authorDetails: (id: number) => [...watchlistBase, 'author', id] as const,
} as const
