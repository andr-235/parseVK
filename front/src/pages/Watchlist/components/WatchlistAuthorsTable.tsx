import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import SectionCard from '@/components/SectionCard'
import {
  Table,
  TableCaption,
} from '@/components/ui/table'
import { useTableSorting } from '@/hooks/useTableSorting'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { filterValidAuthors, validateAuthorId } from '@/utils/watchlistUtils'
import { logger } from '@/utils/logger'
import { LoadingState, EmptyState } from './WatchlistStates'
import { WatchlistAuthorsTableHeader } from './WatchlistAuthorsTableHeader'
import { WatchlistAuthorsTableBody } from './WatchlistAuthorsTableBody'
import { VirtualizedTableBody } from './VirtualizedTableBody'

/**
 * Props для компонента WatchlistAuthorsTable
 */
interface WatchlistAuthorsTableProps {
  /** Массив авторов для отображения в таблице */
  authors: WatchlistAuthorCard[]
  /** Общее количество авторов в списке наблюдения */
  totalAuthors: number
  /** Флаг, указывающий, есть ли ещё авторы для загрузки */
  hasMoreAuthors: boolean
  /** Флаг загрузки списка авторов */
  isLoadingAuthors: boolean
  /** Флаг загрузки дополнительных авторов */
  isLoadingMoreAuthors: boolean
  /** Конфигурация колонок таблицы */
  authorColumns: TableColumn<WatchlistAuthorCard>[]
  /** Callback для выбора автора */
  onSelectAuthor: (id: number) => void
  /** Callback для загрузки дополнительных авторов */
  onLoadMore: () => void
}


/**
 * Компонент таблицы авторов списка наблюдения
 *
 * Отображает список авторов с возможностью сортировки, выбора и загрузки дополнительных данных.
 * Поддерживает клавиатурную навигацию и доступность для скринридеров.
 *
 * @param props - Props компонента
 * @returns JSX элемент таблицы авторов
 */
export const WatchlistAuthorsTable = memo(({
  authors,
  totalAuthors,
  hasMoreAuthors,
  isLoadingAuthors,
  isLoadingMoreAuthors,
  authorColumns,
  onSelectAuthor,
  onLoadMore,
}: WatchlistAuthorsTableProps) => {
  // Валидация props на уровне компонента
  if (!Array.isArray(authors)) {
    throw new Error('WatchlistAuthorsTable: authors должен быть массивом')
  }
  if (typeof totalAuthors !== 'number' || totalAuthors < 0) {
    throw new Error('WatchlistAuthorsTable: totalAuthors должен быть неотрицательным числом')
  }
  if (typeof hasMoreAuthors !== 'boolean') {
    throw new Error('WatchlistAuthorsTable: hasMoreAuthors должен быть boolean')
  }
  if (typeof isLoadingAuthors !== 'boolean') {
    throw new Error('WatchlistAuthorsTable: isLoadingAuthors должен быть boolean')
  }
  if (typeof isLoadingMoreAuthors !== 'boolean') {
    throw new Error('WatchlistAuthorsTable: isLoadingMoreAuthors должен быть boolean')
  }
  if (!Array.isArray(authorColumns)) {
    throw new Error('WatchlistAuthorsTable: authorColumns должен быть массивом')
  }
  if (typeof onSelectAuthor !== 'function') {
    throw new Error('WatchlistAuthorsTable: onSelectAuthor должен быть функцией')
  }
  if (typeof onLoadMore !== 'function') {
    throw new Error('WatchlistAuthorsTable: onLoadMore должен быть функцией')
  }

  // Состояние для управления фокусом на строках таблицы
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null)

  // Защита от бесконечной загрузки - предотвращаем повторные вызовы onLoadMore
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  /**
   * Мемоизированный массив валидных авторов
   * Фильтрует авторов, исключая тех с undefined id и дубликаты id для предотвращения ошибок рендера
   */
  const validAuthors = useMemo(() => filterValidAuthors(authors), [authors])

  const {
    sortedItems: sortedAuthors,
    sortState: authorSortState,
    requestSort: requestAuthorSort,
  } = useTableSorting(
    validAuthors,
    authorColumns.length > 0 ? authorColumns : [],
    {
      initialKey: authorColumns.length > 0 ? 'lastActivityAt' : '',
      initialDirection: 'desc',
    },
  )

  /**
   * Обработчик выбора автора из таблицы
   * Выполняет валидацию ID автора перед вызовом callback'а родительского компонента
   *
   * @param author - Объект автора для выбора
   */
  const handleSelectAuthor = useCallback((author: WatchlistAuthorCard) => {
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
  }, [onSelectAuthor])

  const { tableRef, handleKeyDown } = useKeyboardNavigation({
    itemsLength: sortedAuthors.length,
    onSelect: (index: number) => handleSelectAuthor(sortedAuthors[index]),
    onFocusChange: setFocusedRowIndex,
  })

  /**
   * Обработчик загрузки дополнительных авторов с защитой от бесконечной загрузки
   */
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

  /**
   * Эффект для сброса фокуса при изменении данных
   * Сбрасывает индекс сфокусированной строки при обновлении списка авторов,
   * чтобы избежать несоответствия индексов после фильтрации или сортировки
   */
  useEffect(() => {
    if (focusedRowIndex !== null && focusedRowIndex >= sortedAuthors.length) {
      setFocusedRowIndex(null)
    }
  }, [sortedAuthors.length, focusedRowIndex])

  // Переменные для улучшения читаемости условного рендера
  const isLoading = isLoadingAuthors && !authors.length
  const isEmpty = !isLoadingAuthors && sortedAuthors.length === 0
  const hasData = sortedAuthors.length > 0 && authorColumns.length > 0
  const useVirtualization = sortedAuthors.length > 50 && authorColumns.length > 0 // Виртуализация для списков больше 50 элементов, но только если есть колонки

  return (
    <SectionCard
      title="Список авторов"
      description="Добавленные авторы и статистика найденных комментариев"
      headerActions={(
        // Кнопка "Загрузить ещё" отображается только если есть дополнительные авторы для загрузки
        hasMoreAuthors ? (
          <Button
            key="load-more-button"
            type="button"
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingAuthors || isLoadingMoreAuthors || isLoadingMore}
            aria-label="Загрузить ещё авторов"
          >
            {(isLoadingMoreAuthors || isLoadingMore) ? 'Загружаем…' : 'Загрузить ещё'}
          </Button>
        ) : null
      )}
    >
      {/* aria-live для объявления изменений в состоянии загрузки - обеспечивает доступность для скринридеров */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" key="aria-live">
        {isLoading && 'Загружаем список авторов...'}
        {isLoadingMoreAuthors && 'Загружаем дополнительные авторы...'}
        {isEmpty && 'Список авторов пуст'}
        {hasData && `Загружено ${sortedAuthors.length} авторов из ${totalAuthors}`}
      </div>

      {/* Отображение состояния загрузки при первой загрузке данных */}
      {isLoading ? (
        <LoadingState key="loading-state" />
      ) : null}

      {/* Отображение пустого состояния когда данные загружены но список пуст */}
      {isEmpty ? (
        <EmptyState key="empty-state" />
      ) : null}

      {/* Отображение таблицы только при наличии данных и колонок */}
      {hasData ? (
        <Table
          ref={tableRef}
          role="grid" // Указывает что таблица является интерактивной сеткой для скринридеров
          aria-label="Таблица авторов в списке наблюдения"
          aria-rowcount={sortedAuthors.length} // Количество строк для скринридеров
          aria-colcount={authorColumns.length} // Количество колонок для скринридеров
          aria-describedby="watchlist-authors-caption" // Ссылка на описание таблицы
          aria-activedescendant={focusedRowIndex !== null ? `author-row-${sortedAuthors[focusedRowIndex]?.id}` : undefined} // Текущий активный элемент при клавиатурной навигации
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
          <TableCaption id="watchlist-authors-caption">
            Показано {sortedAuthors.length} валидных авторов из {totalAuthors}.
            {useVirtualization && ' (виртуализированная таблица)'}
          </TableCaption>
        </Table>
      ) : null}
    </SectionCard>
  )
})