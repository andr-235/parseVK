import ProgressBar from '@/shared/components/common/ProgressBar'
import TaskActionsCell from '@/pages/tasks/components/TaskActionsCell'
import { cn } from '@/shared/utils'
import { getTaskStatusText, TASK_STATUS_COLORS, getStatusWeight } from '@/pages/tasks/utils/statusHelpers'
import { calculateTaskProgress } from '@/pages/tasks/utils/taskProgress'
import { formatDate, formatPair, resolveNumber, toNumber } from '@/pages/tasks/config/utils'
import type { TableColumn, Task } from '@/shared/types'

const getResultFromStats = (item: Task): string | null => {
  const posts = toNumber(item.stats?.posts)
  const comments = toNumber(item.stats?.comments)

  if (posts !== null || comments !== null) {
    return formatPair(posts, comments)
  }

  return null
}

const getResultFromProgress = (item: Task): string => {
  const progress = calculateTaskProgress(item)
  const baseTotal = resolveNumber(item.stats?.groups, item.groupsCount)
  const fallbackTotal = Math.max(
    baseTotal ?? 0,
    progress.processed + progress.processing + progress.pending,
    progress.processed
  )
  const total = fallbackTotal > 0 ? fallbackTotal : null
  const failed = Math.min(progress.failed, total ?? progress.failed)
  const derivedSuccess =
    progress.success > 0 ? progress.success : Math.max(progress.processed - failed, 0)
  const success = Math.min(derivedSuccess, total ?? derivedSuccess)

  if (total != null || success > 0 || failed > 0) {
    const displayTotal = total ?? Math.max(success + failed, progress.processed)
    const displaySuccess = Math.max(Math.min(success, displayTotal), 0)
    return formatPair(displaySuccess, displayTotal)
  }

  return '—'
}

const formatResult = (item: Task): string => {
  const statsResult = getResultFromStats(item)
  if (statsResult !== null) {
    return statsResult
  }
  return getResultFromProgress(item)
}

interface TaskProgressCounts {
  total: number
  processedCount: number
  failedCount: number
  successCount: number
  processingCount: number
  pendingCount: number
}

const calculateTaskCounts = (
  item: Task,
  progress: ReturnType<typeof calculateTaskProgress>
): TaskProgressCounts => {
  const baseTotal = typeof item.groupsCount === 'number' ? item.groupsCount : 0
  const fallbackTotal = Math.max(
    baseTotal,
    progress.processed + progress.processing + progress.pending,
    progress.processed,
    0
  )
  const total = progress.total > 0 ? progress.total : fallbackTotal
  const processedCount = Math.min(progress.processed, total)
  const failedCount = Math.min(progress.failed, total)
  const successDerived =
    progress.success > 0 ? progress.success : Math.max(processedCount - failedCount, 0)
  const successCount = Math.min(successDerived, total)
  const processingCount = Math.min(
    progress.processing,
    Math.max(total - processedCount, progress.processing)
  )
  const pendingCount =
    progress.pending > 0 ? progress.pending : Math.max(total - processedCount - processingCount, 0)

  return {
    total,
    processedCount,
    failedCount,
    successCount,
    processingCount,
    pendingCount,
  }
}

const getProgressTone = (
  failedCount: number,
  processedCount: number,
  total: number
): 'danger' | 'success' | 'primary' => {
  if (failedCount > 0 && processedCount >= total) {
    return 'danger'
  }
  if (processedCount >= total) {
    return 'success'
  }
  return 'primary'
}

const columns: TableColumn<Task>[] = [
  {
    header: '№',
    key: 'index',
    render: (_: Task, index: number) => index + 1,
    sortable: false,
  },
  {
    header: 'Название',
    key: 'title',
    render: (item: Task) => item.title ?? '—',
    sortable: true,
    sortValue: (item: Task) => item.title?.toLowerCase() ?? '',
  },
  {
    header: 'Статус',
    key: 'status',
    render: (item: Task) => {
      const progress = calculateTaskProgress(item)
      const counts = calculateTaskCounts(item, progress)
      const { total, processedCount, failedCount, successCount } = counts
      const hasMeta = successCount > 0 || failedCount > 0

      const progressTone = getProgressTone(failedCount, processedCount, total)

      return (
        <div className="flex w-full flex-col gap-3 text-sm text-text-secondary">
          <span
            className={cn(
              'inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]',
              TASK_STATUS_COLORS[item.status] ??
                'bg-muted text-text-secondary ring-1 ring-inset ring-border/60'
            )}
          >
            {getTaskStatusText(item.status)}
          </span>
          {total > 0 && (
            <ProgressBar
              current={processedCount}
              total={total}
              size="small"
              showLabel={false}
              tone={progressTone}
              className="mt-1"
            />
          )}
          {hasMeta && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-relaxed text-text-secondary">
              <span
                className={cn(
                  'whitespace-nowrap font-medium',
                  successCount > 0 && 'text-accent-success'
                )}
              >
                {`Успешно: ${successCount}`}
              </span>
              {failedCount > 0 && (
                <span className="whitespace-nowrap font-medium text-accent-danger">{`Ошибок: ${failedCount}`}</span>
              )}
            </div>
          )}
        </div>
      )
    },
    sortable: true,
    sortValue: (item: Task) => getStatusWeight(item.status),
  },
  {
    header: 'Дата создания',
    key: 'createdAt',
    render: (item: Task) => formatDate(item.createdAt),
    sortable: true,
    sortValue: (item: Task) => (item.createdAt ? new Date(item.createdAt) : null),
  },
  {
    header: 'Дата завершения',
    key: 'completedAt',
    render: (item: Task) => formatDate(item.completedAt),
    sortable: true,
    sortValue: (item: Task) => (item.completedAt ? new Date(item.completedAt) : null),
  },
  {
    header: 'Кол-во групп',
    key: 'groupsCount',
    render: (item: Task) => item.groupsCount,
    sortable: true,
    sortValue: (item: Task) => (typeof item.groupsCount === 'number' ? item.groupsCount : null),
  },
  {
    header: 'Действия',
    key: 'actions',
    render: (item: Task) => <TaskActionsCell task={item} />,
    sortable: false,
  },
  {
    header: 'Результат',
    key: 'result',
    render: formatResult,
    sortable: true,
    sortValue: (item: Task) => {
      const posts = toNumber(item.stats?.posts)
      const comments = toNumber(item.stats?.comments)

      if (posts != null || comments != null) {
        const postsSafe = posts ?? 0
        const commentsSafe = comments ?? 0
        return postsSafe + commentsSafe / 1000
      }

      const progress = calculateTaskProgress(item)
      return progress.success + progress.failed / 1000
    },
  },
]

export const getTaskTableColumns = (): TableColumn<Task>[] => columns
