import { memo, useMemo, useCallback, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTableSorting } from '@/hooks/common'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { filterValidAuthors, validateAuthorId } from '@/utils/watchlist/watchlistUtils'
import { logger } from '@/utils/watchlist/logger'
import { WATCHLIST_CONSTANTS } from '@/config/watchlist/watchlist'
import { DataTableCard } from '@/components/common/DataTableCard'
import { DataTable } from '@/components/common/DataTable'
import toast from 'react-hot-toast'

interface WatchlistTableCardProps {
  authors: WatchlistAuthorCard[]
  totalAuthors: number
  hasMoreAuthors: boolean
  isLoadingAuthors: boolean
  isLoadingMoreAuthors: boolean
  authorColumns: TableColumn<WatchlistAuthorCard>[]
  onSelectAuthor: (id: number) => void
  onLoadMore: () => void
  searchTerm: string
  onSearchChange: (value: string) => void
  onRefresh?: () => void
}

export const WatchlistTableCard = memo(
  ({
    authors,
    totalAuthors,
    hasMoreAuthors,
    isLoadingAuthors,
    isLoadingMoreAuthors,
    authorColumns,
    onSelectAuthor,
    onLoadMore,
    searchTerm,
    onSearchChange,
    onRefresh,
  }: WatchlistTableCardProps) => {
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    const validAuthors = useMemo(() => filterValidAuthors(authors), [authors])

    const {
      sortedItems: sortedAuthors,
      sortState: authorSortState,
      requestSort: requestAuthorSort,
    } = useTableSorting(validAuthors, authorColumns.length > 0 ? authorColumns : [], {
      initialKey: authorColumns.length > 0 ? 'lastActivityAt' : '',
      initialDirection: 'desc',
    })

    const handleSelectAuthor = useCallback(
      (author: WatchlistAuthorCard) => {
        try {
          if (validateAuthorId(author.id)) {
            onSelectAuthor(author.id)
          } else {
            logger.error(`Невалидный ID автора:`, author.id)
            toast.error('Невалидный ID автора')
          }
        } catch (error) {
          logger.error(`Ошибка при выборе автора с ID ${author.id}:`, error)
          toast.error('Не удалось выбрать автора. Попробуйте ещё раз.')
        }
      },
      [onSelectAuthor]
    )

    const handleLoadMore = useCallback(async () => {
      if (isLoadingMore || !hasMoreAuthors || isLoadingAuthors || isLoadingMoreAuthors) {
        return
      }

      setIsLoadingMore(true)
      try {
        await onLoadMore()
      } finally {
        setIsLoadingMore(false)
      }
    }, [isLoadingMore, hasMoreAuthors, isLoadingAuthors, isLoadingMoreAuthors, onLoadMore])

    const isLoading = isLoadingAuthors && !authors.length
    const isEmpty = !isLoadingAuthors && sortedAuthors.length === 0
    const hasData = sortedAuthors.length > 0 && authorColumns.length > 0

    const badgeText = useMemo(() => {
      return searchTerm.trim() ? `${sortedAuthors.length} из ${totalAuthors}` : `${totalAuthors}`
    }, [sortedAuthors.length, totalAuthors, searchTerm])

    const headerActions = useMemo(() => {
      if (!onRefresh) return null
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoadingAuthors}
          className="h-10 text-muted-foreground hover:text-primary"
          title="Обновить список"
        >
          <RefreshCw className={`mr-2 size-4 ${isLoadingAuthors ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      )
    }, [onRefresh, isLoadingAuthors])

    return (
      <DataTableCard
        title="Авторы"
        badgeText={badgeText}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder="Поиск автора..."
        headerActions={headerActions}
        isLoading={isLoading}
        loadingMessage="Загружаем список авторов…"
        isEmpty={isEmpty}
        emptyIcon="👥"
        emptyTitle="Список наблюдения пуст"
        emptyDescription={
          WATCHLIST_CONSTANTS.EMPTY_AUTHORS_MESSAGE ||
          'Добавьте авторов для отслеживания их активности.'
        }
        contentClassName="p-0!"
      >
        <div aria-live="polite" aria-atomic="true" className="sr-only" key="aria-live">
          {isLoadingMoreAuthors && 'Загружаем дополнительные авторы...'}
          {hasData && `Загружено ${sortedAuthors.length} авторов из ${totalAuthors}`}
        </div>

        {hasData && (
          <div className="flex flex-col">
            <DataTable
              data={sortedAuthors}
              columns={authorColumns}
              isLoading={isLoadingAuthors}
              sortState={authorSortState}
              onRequestSort={requestAuthorSort}
              onRowClick={(item) => handleSelectAuthor(item)}
            />
            <div className="flex justify-center py-4 border-t border-border/40 bg-muted/10">
              {hasMoreAuthors ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoadingAuthors || isLoadingMoreAuthors || isLoadingMore}
                >
                  {isLoadingMoreAuthors || isLoadingMore ? 'Загружаем...' : 'Загрузить ещё'}
                </Button>
              ) : (
                <span className="text-xs text-text-secondary font-monitoring-body">
                  Показано {sortedAuthors.length} авторов
                </span>
              )}
            </div>
          </div>
        )}
      </DataTableCard>
    )
  }
)
