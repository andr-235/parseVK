import { memo, useMemo, useCallback, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { List, type ListImperativeAPI, type RowComponentProps } from 'react-window'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { WatchlistAuthorsTableRow } from './WatchlistAuthorsTableRow'
import { useVirtualizedKeyboardNavigation } from '@/shared/hooks'
import { logger } from '@/modules/watchlist/utils/logger'

const DEFAULT_HEIGHT = 400
const DEFAULT_ITEM_SIZE = 48
const OVERSCAN_COUNT = 5

type WatchlistRowProps = {
  sortedAuthors: WatchlistAuthorCard[]
  authorColumns: TableColumn<WatchlistAuthorCard>[]
  focusedRowIndex: number | null
  onSelectAuthor: (author: WatchlistAuthorCard) => void
  onKeyDown: (event: KeyboardEvent, index: number) => void
}

interface VirtualizedTableBodyProps {
  sortedAuthors: WatchlistAuthorCard[]
  authorColumns: TableColumn<WatchlistAuthorCard>[]
  focusedRowIndex: number | null
  onSelectAuthor: (author: WatchlistAuthorCard) => void
  height?: number
  itemSize?: number
}

export const VirtualizedTableBody = memo(
  ({
    sortedAuthors,
    authorColumns,
    focusedRowIndex,
    onSelectAuthor,
    height = DEFAULT_HEIGHT,
    itemSize = DEFAULT_ITEM_SIZE,
  }: VirtualizedTableBodyProps) => {
    const listRef = useRef<ListImperativeAPI | null>(null)

    const { handleKeyDown: virtualizedHandleKeyDown } = useVirtualizedKeyboardNavigation({
      itemsLength: sortedAuthors.length,
      onSelect: (index: number) => onSelectAuthor(sortedAuthors[index]),
      onFocusChange: () => {},
      listRef,
    })

    const rowProps = useMemo<WatchlistRowProps>(
      () => ({
        sortedAuthors,
        authorColumns,
        focusedRowIndex,
        onSelectAuthor,
        onKeyDown: virtualizedHandleKeyDown,
      }),
      [sortedAuthors, authorColumns, focusedRowIndex, onSelectAuthor, virtualizedHandleKeyDown]
    )

    const RowRenderer = ({
      index,
      style,
      ariaAttributes,
      sortedAuthors: authors,
      authorColumns: columns,
      focusedRowIndex: focusedIndex,
      onSelectAuthor: selectAuthor,
      onKeyDown,
    }: RowComponentProps<WatchlistRowProps>) => {
      const author = authors[index]
      if (!author) {
        return <div style={style} {...ariaAttributes} />
      }

      logger.debug('Rendering row', { index, authorId: author.id })

      return (
        <div style={style} {...ariaAttributes}>
          <WatchlistAuthorsTableRow
            author={author}
            index={index}
            authorColumns={columns}
            focusedRowIndex={focusedIndex}
            sortedAuthorsLength={authors.length}
            onSelectAuthor={selectAuthor}
            onKeyDown={onKeyDown}
          />
        </div>
      )
    }

    const handleResize = useCallback(() => {
      // Resize handled by react-window automatically
    }, [])

    return (
      <List
        listRef={listRef}
        defaultHeight={height}
        rowCount={sortedAuthors.length}
        rowHeight={itemSize}
        overscanCount={OVERSCAN_COUNT}
        onResize={handleResize}
        rowComponent={RowRenderer}
        rowProps={rowProps}
        style={{ height, width: '100%' }}
        aria-rowcount={sortedAuthors.length}
      />
    )
  }
)

VirtualizedTableBody.displayName = 'VirtualizedTableBody'
