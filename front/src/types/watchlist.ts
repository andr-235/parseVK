// Типы специфичные для watchlist

export interface WatchlistAuthorColumnsProps {
  handleSelectAuthor: (id: number) => void
  handleRemoveFromWatchlist: (id: number) => void
  pendingRemoval: Record<number, boolean>
}

export interface WatchlistHeroProps {
  settings: import('./index').WatchlistSettings | null
  totalAuthors: number
  isLoadingAuthors: boolean
  isUpdatingSettings: boolean
  onRefresh: () => void
  onToggleTrackAll: () => void
}

export interface WatchlistAuthorsTableProps {
  authors: import('./index').WatchlistAuthorCard[]
  totalAuthors: number
  hasMoreAuthors: boolean
  isLoadingAuthors: boolean
  isLoadingMoreAuthors: boolean
  authorColumns: import('./index').TableColumn<import('./index').WatchlistAuthorCard>[]
  onSelectAuthor: (id: number) => void
  onLoadMore: () => void
}

export interface WatchlistAuthorDetailsProps {
  currentAuthor: import('./index').WatchlistAuthorDetails | null
  isLoadingAuthorDetails: boolean
  commentColumns: import('./index').TableColumn<import('./index').WatchlistComment>[]
}
