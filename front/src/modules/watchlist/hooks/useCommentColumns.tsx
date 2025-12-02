import { useMemo } from 'react'
import type { TableColumn, WatchlistComment } from '@/types'
import { formatDateTime, formatCommentSource } from '@/modules/watchlist/utils/watchlistUtils'

export const useCommentColumns = (): TableColumn<WatchlistComment>[] => {
  return useMemo<TableColumn<WatchlistComment>[]>(
    () => [
      {
        header: 'Дата',
        key: 'publishedAt',
        sortable: true,
        sortValue: (item) => {
          const timestamp = item.publishedAt ?? item.createdAt
          return timestamp ? new Date(timestamp) : null
        },
        render: (item) => formatDateTime(item.publishedAt ?? item.createdAt),
      },
      {
        header: 'Источник',
        key: 'source',
        sortable: true,
        sortValue: (item) => item.source,
        render: (item) => formatCommentSource(item),
      },
      {
        header: 'Комментарий',
        key: 'text',
        sortable: false,
        cellClassName: 'max-w-xl whitespace-pre-wrap text-sm text-text-primary',
        render: (item) => item.text || '—',
      },
      {
        header: 'Ссылка',
        key: 'commentUrl',
        sortable: false,
        render: (item) =>
          item.commentUrl ? (
            <a
              href={item.commentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Открыть
            </a>
          ) : (
            <span className="text-xs text-text-secondary">—</span>
          ),
      },
    ],
    []
  )
}
