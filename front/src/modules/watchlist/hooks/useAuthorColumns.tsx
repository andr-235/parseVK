import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import type { TableColumn, WatchlistAuthorCard } from '@/types'
import { formatDateTime, formatStatus } from '@/modules/watchlist/utils/watchlistUtils'
import { AuthorCell } from '@/modules/watchlist/components/AuthorCell'
import { PhotoAnalysisCell } from '@/modules/watchlist/components/PhotoAnalysisCell'
import { ActionsCell } from '@/modules/watchlist/components/ActionsCell'

/**
 * Константы для ключей колонок таблицы авторов
 */
const COLUMN_KEYS = {
  AUTHOR: 'author',
  STATUS: 'status',
  ANALYSIS_SUMMARY: 'analysisSummary',
  FOUND_COMMENTS_COUNT: 'foundCommentsCount',
  TOTAL_COMMENTS: 'totalComments',
  LAST_ACTIVITY_AT: 'lastActivityAt',
  LAST_CHECKED_AT: 'lastCheckedAt',
  ACTIONS: 'actions',
} as const

/**
 * Пропсы для хука useAuthorColumns
 */
interface AuthorColumnsProps {
  handleSelectAuthor: (id: number) => void
  handleRemoveFromWatchlist: (id: number) => void
  pendingRemoval: Record<number, boolean>
}

/**
 * Данные для конфигурации колонок таблицы авторов
 */
const COLUMN_DATA = [
  {
    header: 'Автор',
    key: COLUMN_KEYS.AUTHOR,
    sortable: true,
    sortValue: (item: WatchlistAuthorCard) => item.author?.fullName?.toLowerCase() ?? '',
    render: (item: WatchlistAuthorCard) => <AuthorCell item={item} />,
  },
  {
    header: 'Статус',
    key: COLUMN_KEYS.STATUS,
    sortable: true,
    sortValue: (item: WatchlistAuthorCard) => item.status,
    render: (item: WatchlistAuthorCard) => (
      <Badge variant="outline">{formatStatus(item.status)}</Badge>
    ),
  },
  {
    header: 'Анализ фото',
    key: COLUMN_KEYS.ANALYSIS_SUMMARY,
    sortable: true,
    sortValue: (item: WatchlistAuthorCard) => item.analysisSummary?.suspicious ?? 0,
    cellClassName: 'max-w-xs',
    render: (item: WatchlistAuthorCard) => <PhotoAnalysisCell item={item} />,
  },
  {
    header: 'Найдено',
    key: COLUMN_KEYS.FOUND_COMMENTS_COUNT,
    sortable: true,
    sortValue: (item: WatchlistAuthorCard) => item.foundCommentsCount ?? 0,
    render: (item: WatchlistAuthorCard) => item.foundCommentsCount,
  },
  {
    header: 'Всего',
    key: COLUMN_KEYS.TOTAL_COMMENTS,
    sortable: true,
    sortValue: (item: WatchlistAuthorCard) => item.totalComments ?? 0,
    render: (item: WatchlistAuthorCard) => item.totalComments,
  },
  {
    header: 'Последняя активность',
    key: COLUMN_KEYS.LAST_ACTIVITY_AT,
    sortable: true,
    sortValue: (item: WatchlistAuthorCard) => (item.lastActivityAt ? new Date(item.lastActivityAt).getTime() : -1),
    render: (item: WatchlistAuthorCard) => formatDateTime(item.lastActivityAt),
  },
  {
    header: 'Последняя проверка',
    key: COLUMN_KEYS.LAST_CHECKED_AT,
    sortable: true,
    sortValue: (item: WatchlistAuthorCard) => (item.lastCheckedAt ? new Date(item.lastCheckedAt).getTime() : -1),
    render: (item: WatchlistAuthorCard) => formatDateTime(item.lastCheckedAt),
  },
  {
    header: 'Действия',
    key: COLUMN_KEYS.ACTIONS,
    sortable: false,
    render: (item: WatchlistAuthorCard, handleSelectAuthor: (id: number) => void, handleRemoveFromWatchlist: (id: number) => void, pendingRemoval: Record<number, boolean>) => (
      <ActionsCell
        item={item}
        handleSelectAuthor={handleSelectAuthor}
        handleRemoveFromWatchlist={handleRemoveFromWatchlist}
        pendingRemoval={pendingRemoval}
      />
    ),
  },
] as const

/**
 * Хук для генерации колонок таблицы авторов списка наблюдения
 * @param props - Пропсы для обработки действий с авторами
 * @returns Массив колонок для таблицы
 */
export const useAuthorColumns = ({
  handleSelectAuthor,
  handleRemoveFromWatchlist,
  pendingRemoval,
}: AuthorColumnsProps): TableColumn<WatchlistAuthorCard>[] => {
  return useMemo<TableColumn<WatchlistAuthorCard>[]>(() =>
    COLUMN_DATA.map(config => ({
      ...config,
      render: config.key === COLUMN_KEYS.ACTIONS
        ? (item: WatchlistAuthorCard) => config.render(item, handleSelectAuthor, handleRemoveFromWatchlist, pendingRemoval)
        : config.render,
    })),
    [handleSelectAuthor, handleRemoveFromWatchlist, pendingRemoval]
  )
}
