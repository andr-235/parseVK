import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import SearchInput from '@/shared/components/SearchInput'
import { Table, TableCaption } from '@/shared/ui/table'
import { useTableSorting } from '@/hooks/useTableSorting'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { filterValidAuthors, validateAuthorId } from '@/modules/watchlist/utils/watchlistUtils'
import { logger } from '@/modules/watchlist/utils/logger'
import { LoadingState, EmptyState } from './WatchlistStates'
import { WatchlistAuthorsTableHeader } from './WatchlistAuthorsTableHeader'
import { WatchlistAuthorsTableBody } from './WatchlistAuthorsTableBody'
import { VirtualizedTableBody } from './VirtualizedTableBody'
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
    const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null)
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

    const { tableRef, handleKeyDown } = useKeyboardNavigation({
      itemsLength: sortedAuthors.length,
      onSelect: (index: number) => handleSelectAuthor(sortedAuthors[index]),
      onFocusChange: setFocusedRowIndex,
    })

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

    useEffect(() => {
      if (focusedRowIndex !== null && focusedRowIndex >= sortedAuthors.length) {
        setFocusedRowIndex(null)
      }
    }, [sortedAuthors.length, focusedRowIndex])

    const isLoading = isLoadingAuthors && !authors.length
    const isEmpty = !isLoadingAuthors && sortedAuthors.length === 0
    const hasData = sortedAuthors.length > 0 && authorColumns.length > 0
    const useVirtualization = sortedAuthors.length > 50 && authorColumns.length > 0

    const badgeText = searchTerm.trim()
      ? `${sortedAuthors.length} из ${totalAuthors}`
      : `${totalAuthors}`

    return (
      <Card className="overflow-hidden rounded-xl border border-border shadow-sm">
        <div className="flex flex-col gap-4 border-b bg-muted/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Авторы</h2>
            {!isLoading && (
              <Badge
                variant="secondary"
                className="bg-background/50 px-2 py-0.5 text-xs font-normal text-muted-foreground"
              >
                {badgeText}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Поиск автора..."
              className="h-9 w-full sm:w-[250px]"
            />
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoadingAuthors}
                className="h-9 text-muted-foreground hover:text-primary"
                title="Обновить список"
              >
                <RefreshCw className={`mr-2 size-4 ${isLoadingAuthors ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          <div aria-live="polite" aria-atomic="true" className="sr-only" key="aria-live">
            {isLoading && 'Загружаем список авторов...'}
            {isLoadingMoreAuthors && 'Загружаем дополнительные авторы...'}
            {isEmpty && 'Список авторов пуст'}
            {hasData && `Загружено ${sortedAuthors.length} авторов из ${totalAuthors}`}
          </div>

          {isLoading && <LoadingState key="loading-state" />}

          {!isLoading && isEmpty && <EmptyState key="empty-state" />}

          {hasData && (
            <Table
              ref={tableRef}
              role="grid"
              aria-label="Таблица авторов в списке наблюдения"
              aria-rowcount={sortedAuthors.length}
              aria-colcount={authorColumns.length}
              aria-activedescendant={
                focusedRowIndex !== null
                  ? `author-row-${sortedAuthors[focusedRowIndex]?.id}`
                  : undefined
              }
              key="authors-table"
            >
              <WatchlistAuthorsTableHeader
                authorColumns={authorColumns}
                authorSortState={authorSortState}
                requestAuthorSort={requestAuthorSort}
              />
              {useVirtualization ? (
                <tbody>
                  <tr>
                    <td colSpan={authorColumns.length} style={{ padding: 0, border: 'none' }}>
                      <VirtualizedTableBody
                        sortedAuthors={sortedAuthors}
                        authorColumns={authorColumns}
                        focusedRowIndex={focusedRowIndex}
                        onSelectAuthor={handleSelectAuthor}
                        height={400}
                        itemSize={48}
                      />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <WatchlistAuthorsTableBody
                  sortedAuthors={sortedAuthors}
                  authorColumns={authorColumns}
                  focusedRowIndex={focusedRowIndex}
                  onSelectAuthor={handleSelectAuthor}
                  onKeyDown={handleKeyDown}
                />
              )}
              <TableCaption className="pb-4">
                {hasMoreAuthors ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={isLoadingAuthors || isLoadingMoreAuthors || isLoadingMore}
                    className="mt-2"
                  >
                    {isLoadingMoreAuthors || isLoadingMore ? 'Загружаем...' : 'Загрузить ещё'}
                  </Button>
                ) : (
                  `Показано ${sortedAuthors.length} авторов`
                )}
              </TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>
    )
  }
)
