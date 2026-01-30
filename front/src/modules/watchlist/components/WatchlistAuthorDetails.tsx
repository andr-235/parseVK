import SectionCard from '@/shared/components/SectionCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/shared/ui/table'
import { TableSortButton } from '@/shared/ui/table-sort-button'
import { Spinner } from '@/shared/ui/spinner'
import { useTableSorting } from '@/hooks/useTableSorting'
import type {
  WatchlistAuthorDetails as WatchlistAuthorDetailsType,
  WatchlistComment,
  TableColumn,
} from '@/types'
import {
  formatDateTime,
  formatStatus,
  getPrimitiveColumnValue,
} from '@/modules/watchlist/utils/watchlistUtils'

interface WatchlistAuthorDetailsProps {
  currentAuthor: WatchlistAuthorDetailsType | null
  isLoadingAuthorDetails: boolean
  commentColumns: TableColumn<WatchlistComment>[]
}

export const WatchlistAuthorDetails = ({
  currentAuthor,
  isLoadingAuthorDetails,
  commentColumns,
}: WatchlistAuthorDetailsProps) => {
  const commentItems = currentAuthor?.comments.items ?? []
  const {
    sortedItems: sortedComments,
    sortState: commentSortState,
    requestSort: requestCommentSort,
  } = useTableSorting(commentItems, commentColumns, {
    initialKey: 'publishedAt',
    initialDirection: 'desc',
  })

  return (
    <SectionCard
      title="Активность автора"
      description={
        currentAuthor
          ? currentAuthor.author.fullName
          : 'Выберите автора, чтобы увидеть историю комментариев'
      }
    >
      {isLoadingAuthorDetails && !currentAuthor ? (
        <div key="loading-author-details" className="flex items-center justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : null}

      {currentAuthor ? (
        <div key="author-details-content" className="flex flex-col gap-6">
          <div key="author-info" className="flex flex-wrap gap-4 text-sm text-text-secondary">
            <span>Статус: {formatStatus(currentAuthor.status)}</span>
            <span>Найдено комментариев: {currentAuthor.foundCommentsCount}</span>
            <span>Всего сохранено: {currentAuthor.totalComments}</span>
            <span>Последняя проверка: {formatDateTime(currentAuthor.lastCheckedAt)}</span>
          </div>

          {currentAuthor.comments.items.length > 0 ? (
            <Table key="comments-table">
              <TableHeader>
                <TableRow>
                  {commentColumns.map((column) => (
                    <TableHead key={column.key} className={column.headerClassName}>
                      {column.sortable ? (
                        <TableSortButton
                          direction={
                            commentSortState?.key === column.key ? commentSortState.direction : null
                          }
                          onClick={() => requestCommentSort(column.key)}
                        >
                          {column.header}
                        </TableSortButton>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedComments.map((comment, index) => (
                  <TableRow key={comment.id ?? index}>
                    {commentColumns.map((column) => (
                      <TableCell key={column.key} className={column.cellClassName}>
                        {column.render
                          ? column.render(comment, index)
                          : (getPrimitiveColumnValue(comment, column.key) ??
                            column.emptyValue ??
                            '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                Показано {sortedComments.length} комментариев из {currentAuthor.comments.total}.
              </TableCaption>
            </Table>
          ) : (
            <div key="no-comments" className="py-6 text-sm text-text-secondary">
              Пока нет комментариев, найденных мониторингом.
            </div>
          )}
        </div>
      ) : !isLoadingAuthorDetails ? (
        <div key="select-author" className="py-6 text-sm text-text-secondary">
          Выберите автора из списка, чтобы увидеть историю его комментариев.
        </div>
      ) : null}
    </SectionCard>
  )
}
