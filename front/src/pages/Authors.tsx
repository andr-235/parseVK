import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageHeroCard from '@/components/PageHeroCard'
import { useAuthorsStore, usePhotoAnalysisStore } from '@/stores'
import type { AuthorCard, AuthorSortField, PhotoAnalysisSummary } from '@/types'
import { AuthorsFiltersPanel } from './Authors/components/AuthorsFiltersPanel'
import { AuthorsTableCard } from './Authors/components/AuthorsTableCard'

const resolveProfileUrl = (author: AuthorCard): string => {
  if (author.profileUrl) {
    return author.profileUrl
  }

  if (author.domain) {
    return `https://vk.com/${author.domain}`
  }

  if (author.screenName) {
    return `https://vk.com/${author.screenName}`
  }

  return `https://vk.com/id${author.vkUserId}`
}

function Authors() {
  const authors = useAuthorsStore((state) => state.authors)
  const hasMore = useAuthorsStore((state) => state.hasMore)
  const isLoading = useAuthorsStore((state) => state.isLoading)
  const isLoadingMore = useAuthorsStore((state) => state.isLoadingMore)
  const isRefreshing = useAuthorsStore((state) => state.isRefreshing)
  const fetchAuthors = useAuthorsStore((state) => state.fetchAuthors)
  const loadMore = useAuthorsStore((state) => state.loadMore)
  const refreshAuthors = useAuthorsStore((state) => state.refreshAuthors)
  const storeSearch = useAuthorsStore((state) => state.search)
  const setStoreSearch = useAuthorsStore((state) => state.setSearch)
  const statusFilter = useAuthorsStore((state) => state.statusFilter)
  const setStatusFilter = useAuthorsStore((state) => state.setStatusFilter)
  const sortBy = useAuthorsStore((state) => state.sortBy)
  const sortOrder = useAuthorsStore((state) => state.sortOrder)
  const setSort = useAuthorsStore((state) => state.setSort)
  const analyzeAuthor = usePhotoAnalysisStore((state) => state.analyzeAuthor)
  const isAnalyzing = usePhotoAnalysisStore((state) => state.isAnalyzing)

  const navigate = useNavigate()
  const navigateToAuthorDetails = useCallback(
    (author: AuthorCard, summary: PhotoAnalysisSummary) => {
      const avatar = author.photo200 ?? author.photo100 ?? author.photo50 ?? null

      navigate(`/authors/${author.vkUserId}/analysis`, {
        state: {
          author: {
            vkUserId: author.vkUserId,
            firstName: author.firstName,
            lastName: author.lastName,
            fullName: author.fullName,
            avatar,
            profileUrl: resolveProfileUrl(author),
            screenName: author.screenName,
            domain: author.domain,
          },
          summary,
        },
      })
    },
    [navigate],
  )

  const handleOpenDetails = useCallback(
    (author: AuthorCard) => {
      navigateToAuthorDetails(author, author.summary)
    },
    [navigateToAuthorDetails],
  )
  const [analyzingVkUserId, setAnalyzingVkUserId] = useState<number | null>(null)

  const [searchValue, setSearchValue] = useState(storeSearch)
  const isInitialSearch = useRef(true)

  useEffect(() => {
    if (isInitialSearch.current) {
      isInitialSearch.current = false
      setStoreSearch(searchValue)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setStoreSearch(searchValue)
    }, 400)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchValue, setStoreSearch])

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  const handleStatusFilterChange = useCallback(
    (value: 'unverified' | 'verified' | 'all') => {
      if (value === statusFilter) {
        return
      }

      setStatusFilter(value)
    },
    [setStatusFilter, statusFilter]
  )

  const handleLoadMore = useCallback(() => {
    loadMore().catch((error) => {
      console.error('Не удалось загрузить дополнительные записи авторов', error)
    })
  }, [loadMore])

  const handleRefresh = useCallback(() => {
    refreshAuthors().catch((error) => {
      console.error('Не удалось обновить таблицу авторов', error)
    })
  }, [refreshAuthors])

  const handleAnalyzePhotos = useCallback(
    async (author: AuthorCard) => {
      if (isAnalyzing) {
        return
      }

      setAnalyzingVkUserId(author.vkUserId)

      const batchSize = 10
      const totalPhotos = typeof author.photosCount === 'number' && author.photosCount > 0
        ? Math.min(author.photosCount, 200)
        : 200
      const maxBatches = Math.max(Math.ceil(totalPhotos / batchSize), 1)
      let analyzedTotal = author.summary.total
      let lastSummary = author.summary
      let offset = 0
      let batchesAttempted = 0

      try {
        while (batchesAttempted < maxBatches) {
          const remaining = totalPhotos - offset

          if (remaining <= 0 && batchesAttempted > 0) {
            break
          }

          const batchLimit = Math.max(
            Math.min(remaining > 0 ? remaining : batchSize, batchSize),
            1,
          )

          const response = await analyzeAuthor(author.vkUserId, {
            limit: batchLimit,
            offset,
          })
          batchesAttempted += 1
          lastSummary = response.summary
          const newTotal = response.analyzedCount
          const processedInBatch = newTotal - analyzedTotal

          offset += batchLimit
          if (processedInBatch <= 0) {
            if (offset < totalPhotos) {
              continue
            }
            break
          }

          analyzedTotal = newTotal

          if (offset >= totalPhotos) {
            break
          }
        }

        try {
          await fetchAuthors({ reset: true })
        } catch (updateError) {
          console.error('Не удалось обновить данные автора после анализа', updateError)
          toast.error('Не удалось обновить данные автора после анализа')
        }

        navigateToAuthorDetails(author, lastSummary)
        toast.success('Анализ фотографий выполнен')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Не удалось выполнить анализ фотографий автора'
        toast.error(message)
        console.error('Ошибка анализа фотографий автора', error)
      } finally {
        setAnalyzingVkUserId(null)
      }
    },
    [analyzeAuthor, fetchAuthors, isAnalyzing, navigateToAuthorDetails],
  )

  const handleSortChange = useCallback(
    (field: AuthorSortField) => {
      setSort(field)
    },
    [setSort],
  )

  const emptyTitle = statusFilter === 'unverified' ? 'Нет авторов для проверки' : 'Авторы не найдены'
  const emptyDescription = statusFilter === 'unverified'
    ? 'Все найденные авторы уже отмечены как проверенные. Попробуйте сменить фильтр или обновить данные.'
    : 'Попробуйте изменить фильтр или уточнить поисковый запрос.'

  return (
    <div className="flex flex-col gap-8 w-full">
      <PageHeroCard
        title="Авторы ВКонтакте"
        description="База авторов, собранная через парсинг и мониторинг. Управляйте статусами проверки и анализируйте профили."
        className="mb-2"
      />

      <div className="flex flex-col gap-6">
         <AuthorsFiltersPanel 
            searchTerm={searchValue}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing || isLoading}
         />

         <AuthorsTableCard 
            authors={authors}
            isLoading={isLoading}
            sortBy={sortBy ?? 'fullName'}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            onOpenDetails={handleOpenDetails}
            onAnalyzePhotos={handleAnalyzePhotos}
            analyzingVkUserId={analyzingVkUserId}
            isAnalyzing={isAnalyzing}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
         />
      </div>
    </div>
  )
}

export default Authors
