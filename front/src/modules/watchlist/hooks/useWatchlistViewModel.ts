import { useMemo, useState } from 'react'
import { useWatchlistAuthors } from '@/modules/watchlist/hooks/useWatchlistAuthors'
import { useWatchlistSettings } from '@/modules/watchlist/hooks/useWatchlistSettings'
import { useAuthorColumns } from '@/modules/watchlist/hooks/useAuthorColumns'
import { useCommentColumns } from '@/modules/watchlist/hooks/useCommentColumns'

export const useWatchlistViewModel = () => {
  const {
    authors,
    totalAuthors,
    hasMoreAuthors,
    isLoadingAuthors,
    isLoadingMoreAuthors,
    currentAuthor,
    isLoadingAuthorDetails,
    pendingRemoval,
    handleRefresh,
    handleLoadMore,
    handleRemoveFromWatchlist,
    handleSelectAuthor,
  } = useWatchlistAuthors()

  const {
    settings,
    isUpdatingSettings,
    handleToggleTrackAll,
  } = useWatchlistSettings()

  const [searchTerm, setSearchTerm] = useState('')

  const filteredAuthors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return authors

    return authors.filter((item) => {
      const nameMatch = item.author.fullName.toLowerCase().includes(normalizedSearch)
      const screenNameMatch = item.author.screenName?.toLowerCase().includes(normalizedSearch)
      const vkIdMatch = String(item.authorVkId ?? '').includes(normalizedSearch)
      return Boolean(nameMatch || screenNameMatch || vkIdMatch)
    })
  }, [authors, searchTerm])

  const authorColumns = useAuthorColumns({
    handleSelectAuthor,
    handleRemoveFromWatchlist,
    pendingRemoval,
  })

  const commentColumns = useCommentColumns()

  return {
    filteredAuthors,
    totalAuthors,
    hasMoreAuthors,
    isLoadingAuthors,
    isLoadingMoreAuthors,
    currentAuthor,
    isLoadingAuthorDetails,
    settings,
    isUpdatingSettings,
    searchTerm,
    setSearchTerm,
    authorColumns,
    commentColumns,
    handleRefresh,
    handleLoadMore,
    handleToggleTrackAll,
  }
}
