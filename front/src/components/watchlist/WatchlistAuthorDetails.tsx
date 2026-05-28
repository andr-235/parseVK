import { SectionCard } from '@/components/common'
import { Spinner } from '@/components/ui/spinner'
import { useTableSorting } from '@/hooks/common'
import { DataTable } from '@/components/common/DataTable'
import type {
  WatchlistAuthorDetails as WatchlistAuthorDetailsType,
  WatchlistComment,
  TableColumn,
} from '@/types'
import { formatDateTime, formatStatus } from '@/utils/watchlist/watchlistUtils'

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
            <div className="flex flex-col gap-4">
              <DataTable
                data={sortedComments}
                columns={commentColumns}
                sortState={commentSortState}
                onRequestSort={requestCommentSort}
              />
              <div className="text-center text-xs text-text-secondary font-monitoring-body pb-2">
                Показано {sortedComments.length} комментариев из {currentAuthor.comments.total}
              </div>
            </div>
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
