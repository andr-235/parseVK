import { useCallback, useEffect, useMemo, useState } from 'react'
import { useWatchlistStore } from '@/store'
import type { WatchlistAuthorDetails } from '@/types'

export const useWatchlistAuthors = () => {
  const authors = useWatchlistStore((state) => state.authors)
  const totalAuthors = useWatchlistStore((state) => state.totalAuthors)
  const hasMoreAuthors = useWatchlistStore((state) => state.hasMoreAuthors)
  const isLoadingAuthors = useWatchlistStore((state) => state.isLoadingAuthors)
  const isLoadingMoreAuthors = useWatchlistStore((state) => state.isLoadingMoreAuthors)
  const fetchAuthors = useWatchlistStore((state) => state.fetchAuthors)
  const selectedAuthor = useWatchlistStore((state) => state.selectedAuthor)
  const isLoadingAuthorDetails = useWatchlistStore((state) => state.isLoadingAuthorDetails)
  const fetchAuthorDetails = useWatchlistStore((state) => state.fetchAuthorDetails)
  const updateAuthorStatus = useWatchlistStore((state) => state.updateAuthorStatus)

  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (selectedAuthorId === null) {
      return
    }

    const loadDetails = async () => {
      try {
        await fetchAuthorDetails(selectedAuthorId)
      } catch (error) {
        console.error('Не удалось загрузить детали автора', error)
      }
    }

    void loadDetails()
  }, [fetchAuthorDetails, selectedAuthorId])

  const currentAuthor = useMemo((): WatchlistAuthorDetails | null => {
    if (!selectedAuthor || selectedAuthorId === null) {
      return null
    }

    return selectedAuthor.id === selectedAuthorId ? selectedAuthor : null
  }, [selectedAuthor, selectedAuthorId])

  const handleRefresh = useCallback(() => {
    const refresh = async () => {
      try {
        await fetchAuthors({ reset: true })
      } catch (error) {
        console.error('Не удалось обновить список авторов', error)
      }
    }

    void refresh()
  }, [fetchAuthors])

  const handleLoadMore = useCallback(() => {
    const loadMore = async () => {
      try {
        await fetchAuthors({ reset: false })
      } catch (error) {
        console.error('Не удалось загрузить дополнительный список авторов', error)
      }
    }

    void loadMore()
  }, [fetchAuthors])

  const handleRemoveFromWatchlist = useCallback(
    (id: number) => {
      setPendingRemoval((prev) => ({ ...prev, [id]: true }))

      const remove = async () => {
        try {
          await updateAuthorStatus(id, 'STOPPED')
        } catch (error) {
          console.error('Не удалось убрать автора из списка «На карандаше»', error)
        } finally {
          setPendingRemoval((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
          })
        }
      }

      void remove()
    },
    [updateAuthorStatus],
  )

  const handleSelectAuthor = useCallback((id: number) => {
    setSelectedAuthorId(id)
  }, [])

  return {
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
  }
}