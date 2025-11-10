import { memo } from 'react'
import { TableBody } from '@/components/ui/table'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { WatchlistAuthorsTableRow } from './WatchlistAuthorsTableRow'

interface WatchlistAuthorsTableBodyProps {
  sortedAuthors: WatchlistAuthorCard[]
  authorColumns: TableColumn<WatchlistAuthorCard>[]
  focusedRowIndex: number | null
  onSelectAuthor: (author: WatchlistAuthorCard) => void
  onKeyDown: (e: React.KeyboardEvent, index: number) => void
}

export const WatchlistAuthorsTableBody = memo(({
  sortedAuthors,
  authorColumns,
  focusedRowIndex,
  onSelectAuthor,
  onKeyDown,
}: WatchlistAuthorsTableBodyProps) => {
  return (
    <TableBody>
      {sortedAuthors.map((author, index) => (
        <WatchlistAuthorsTableRow
          key={author.id}
          author={author}
          index={index}
          authorColumns={authorColumns}
          focusedRowIndex={focusedRowIndex}
          sortedAuthorsLength={sortedAuthors.length}
          onSelectAuthor={onSelectAuthor}
          onKeyDown={onKeyDown}
        />
      ))}
    </TableBody>
  )
})