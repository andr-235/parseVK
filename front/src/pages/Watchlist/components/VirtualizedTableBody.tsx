import { memo, useCallback, useRef, type ReactNode } from 'react'
import { List } from 'react-window'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { WatchlistAuthorsTableRow } from './WatchlistAuthorsTableRow'
import { useVirtualizedKeyboardNavigation } from '@/hooks/useVirtualizedKeyboardNavigation'
import { logger } from '@/utils/logger'

const DEFAULT_HEIGHT = 400
const DEFAULT_ITEM_SIZE = 48
const OVERSCAN_COUNT = 5

interface VirtualizedTableBodyProps {
  sortedAuthors: WatchlistAuthorCard[]
  authorColumns: TableColumn<WatchlistAuthorCard>[]
  focusedRowIndex: number | null
  onSelectAuthor: (author: WatchlistAuthorCard) => void
  height?: number
  itemSize?: number
}

export const VirtualizedTableBody = memo(({
  sortedAuthors,
  authorColumns,
  focusedRowIndex,
  onSelectAuthor,
  height = DEFAULT_HEIGHT,
  itemSize = DEFAULT_ITEM_SIZE,
}: VirtualizedTableBodyProps) => {
  const listRef = useRef<{
    scrollToItem: (index: number, align?: string) => void
  } | null>(null)

  const { handleKeyDown: virtualizedHandleKeyDown, handleScroll } = useVirtualizedKeyboardNavigation({
    itemsLength: sortedAuthors.length,
    onSelect: (index) => onSelectAuthor(sortedAuthors[index]),
    onFocusChange: () => {}, // Фокус управляется через focusedRowIndex
    listRef,
  })

  const renderRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }): ReactNode => {
    const author = sortedAuthors[index]
    if (!author) return null

    logger.debug('Rendering row', { index, authorId: author.id })

    return (
      <div style={style} key={author.id}>
        <WatchlistAuthorsTableRow
          author={author}
          index={index}
          authorColumns={authorColumns}
          focusedRowIndex={focusedRowIndex}
          sortedAuthorsLength={sortedAuthors.length}
          onSelectAuthor={onSelectAuthor}
          onKeyDown={virtualizedHandleKeyDown}
        />
      </div>
    )
  }, [sortedAuthors, authorColumns, focusedRowIndex, onSelectAuthor, virtualizedHandleKeyDown])

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={sortedAuthors.length}
      itemSize={itemSize}
      overscanCount={OVERSCAN_COUNT}
      onScroll={handleScroll}
      aria-rowcount={sortedAuthors.length}
    >
      {renderRow}
    </List>
  )
})

VirtualizedTableBody.displayName = 'VirtualizedTableBody'