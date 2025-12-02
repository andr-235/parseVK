import { memo, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import {
  TableRow,
  TableCell,
} from '@/components/ui/table'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { getPrimitiveColumnValue } from '@/modules/watchlist/utils/watchlistUtils'
import { logger } from '@/modules/watchlist/utils/logger'

/**
 * Интерфейс пропсов для компонента WatchlistAuthorsTableRow.
 * Определяет свойства, необходимые для рендеринга строки таблицы авторов watchlist.
 * @interface WatchlistAuthorsTableRowProps
 * @property {WatchlistAuthorCard} author - Данные автора для отображения в строке таблицы.
 * @property {number} index - Индекс строки в таблице (начиная с 0).
 * @property {TableColumn<WatchlistAuthorCard>[]} authorColumns - Массив конфигураций колонок таблицы.
 * @property {number | null} focusedRowIndex - Индекс текущей фокусированной строки или null.
 * @property {number} sortedAuthorsLength - Общее количество отсортированных авторов в таблице.
 * @property {(author: WatchlistAuthorCard) => void} onSelectAuthor - Функция обратного вызова для выбора автора.
 * @property {(e: KeyboardEvent, index: number) => void} onKeyDown - Функция обратного вызова для обработки нажатий клавиш.
 */
interface WatchlistAuthorsTableRowProps {
  author: WatchlistAuthorCard
  index: number
  authorColumns: TableColumn<WatchlistAuthorCard>[]
  focusedRowIndex: number | null
  sortedAuthorsLength: number
  onSelectAuthor: (author: WatchlistAuthorCard) => void
  onKeyDown: (e: KeyboardEvent, index: number) => void
}

/**
 * Компонент строки таблицы авторов watchlist.
 * Отображает одну строку с данными автора в виртуализированной таблице.
 * Поддерживает клавиатурную навигацию, доступность и обработку ошибок рендеринга.
 * @component
 * @param {WatchlistAuthorsTableRowProps} props - Пропсы компонента.
 * @returns {JSX.Element} Элемент строки таблицы.
 */
export const WatchlistAuthorsTableRow = memo(({
  author,
  index,
  authorColumns,
  focusedRowIndex,
  sortedAuthorsLength,
  onSelectAuthor,
  onKeyDown,
}: WatchlistAuthorsTableRowProps) => {
  const handleSelectAuthor = useCallback(() => {
    onSelectAuthor(author)
  }, [author, onSelectAuthor])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelectAuthor()
    }

    onKeyDown(e, index)
  }, [onKeyDown, index, handleSelectAuthor])

  return (
    <TableRow
      id={`author-row-${author.id}`}
      data-row-index={index}
      className="cursor-pointer hover:bg-muted/40"
      onClick={handleSelectAuthor}
      role="row"
      tabIndex={focusedRowIndex === index ? 0 : -1}
      aria-selected={focusedRowIndex === index}
      aria-rowindex={index + 1}
      aria-setsize={sortedAuthorsLength}
      aria-label={`Автор ${author.author.fullName || author.id}, строка ${index + 1} из ${sortedAuthorsLength}`}
      onKeyDown={handleKeyDown}
    >
      {authorColumns.map((column, colIndex) => (
        <TableCell
          key={column.key}
          className={column.cellClassName}
          role="gridcell"
          aria-colindex={colIndex + 1}
          aria-describedby={`col-${column.key}`}
        >
          {column.render
            ? (() => {
                try {
                  return column.render(author, index)
                } catch (error) {
                  logger.error('Ошибка рендера колонки:', error)
                  return column.emptyValue ?? 'Ошибка рендера'
                }
              })()
            : getPrimitiveColumnValue(author, column.key) ?? column.emptyValue ?? '—'}
        </TableCell>
      ))}
    </TableRow>
  )
})

WatchlistAuthorsTableRow.displayName = 'WatchlistAuthorsTableRow'