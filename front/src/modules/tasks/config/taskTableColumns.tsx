import ProgressBar from '@/components/ProgressBar'
import TaskActionsCell from '../components/TaskActionsCell'
import { cn } from '@/lib/utils'
import { getTaskStatusText } from '@/utils/statusHelpers'
import { calculateTaskProgress } from '@/utils/taskProgress'
import { formatDate, formatPair, resolveNumber, toNumber } from './utils'
import type { TableColumn, Task } from '@/types'

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
  const derivedSuccess = progress.success > 0
    ? progress.success
    : Math.max(progress.processed - failed, 0)
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

const STATUS_WEIGHTS: Record<Task['status'], number> = {
  pending: 0,
  processing: 1,
  running: 2,
  completed: 3,
  failed: 4,
}

const STATUS_BADGE_STYLES: Record<Task['status'], string> = {
  pending: 'bg-amber-500/20 text-amber-500 ring-1 ring-inset ring-amber-500/30',
  processing: 'bg-indigo-500/20 text-indigo-500 ring-1 ring-inset ring-indigo-500/30',
  running: 'bg-sky-500/20 text-sky-500 ring-1 ring-inset ring-sky-500/30',
  completed: 'bg-emerald-500/20 text-emerald-500 ring-1 ring-inset ring-emerald-500/30',
  failed: 'bg-rose-500/20 text-rose-400 ring-1 ring-inset ring-rose-500/30',
}

interface TaskProgressCounts {
  total: number
  processedCount: number
  failedCount: number
  successCount: number
  processingCount: number
  pendingCount: number
}

const calculateTaskCounts = (item: Task, progress: ReturnType<typeof calculateTaskProgress>): TaskProgressCounts => {
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
  const successDerived = progress.success > 0
    ? progress.success
    : Math.max(processedCount - failedCount, 0)
  const successCount = Math.min(successDerived, total)
  const processingCount = Math.min(progress.processing, Math.max(total - processedCount, progress.processing))
  const pendingCount = progress.pending > 0
    ? progress.pending
    : Math.max(total - processedCount - processingCount, 0)

  return {
    total,
    processedCount,
    failedCount,
    successCount,
    processingCount,
    pendingCount
  }
}

const getScopeLabel = (item: Task, totalNormalized: number | null): string | null => {
  if (!item.scope) {
    return null
  }

  const normalizedScope = typeof item.scope === 'string' ? item.scope.toUpperCase() : item.scope
  if (normalizedScope === 'ALL') {
    return 'Все группы'
  }
  if (normalizedScope === 'SELECTED') {
    const count = Array.isArray(item.groupIds) ? item.groupIds.length : totalNormalized ?? undefined
    return `Выбранные${count ? ` (${count})` : ''}`
  }
  return item.scope
}

const getSkippedLabel = (item: Task): { label: string | null; raw: string } => {
  const skippedPreviewRaw = typeof item.skippedGroupsMessage === 'string'
    ? item.skippedGroupsMessage.trim()
    : ''
  const hasSkipped = skippedPreviewRaw.length > 0
  const skippedLabel = hasSkipped
    ? (skippedPreviewRaw.length > 80
      ? `${skippedPreviewRaw.slice(0, 80).trim()}…`
      : skippedPreviewRaw)
    : null

  return { label: skippedLabel, raw: skippedPreviewRaw }
}

const getProgressTone = (failedCount: number, processedCount: number, total: number): 'danger' | 'success' | 'primary' => {
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
      const { total, processedCount, failedCount, successCount, processingCount, pendingCount } = counts
      const totalNormalized = total > 0 ? total : null

      const scopeLabel = getScopeLabel(item, totalNormalized)
      const postLimitValue = typeof item.postLimit === 'number' && Number.isFinite(item.postLimit)
        ? item.postLimit
        : null
      const { label: skippedLabel, raw: skippedPreviewRaw } = getSkippedLabel(item)
      const hasSkipped = skippedPreviewRaw.length > 0

      const hasMeta =
        total > 0 ||
        successCount > 0 ||
        failedCount > 0 ||
        processingCount > 0 ||
        pendingCount > 0 ||
        scopeLabel !== null ||
        postLimitValue !== null ||
        hasSkipped

      const progressTone = getProgressTone(failedCount, processedCount, total)

      return (
        <div className="flex w-full flex-col gap-3 text-sm text-text-secondary">
          <span
            className={cn(
              'inline-flex items-center self-start rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em]',
              STATUS_BADGE_STYLES[item.status] ?? 'bg-muted text-text-secondary ring-1 ring-inset ring-border/60'
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
              {scopeLabel && <span className="whitespace-nowrap">{scopeLabel}</span>}
              {postLimitValue !== null && (
                <span className="whitespace-nowrap">{`Лимит постов: ${postLimitValue}`}</span>
              )}
              {total > 0 && <span className="whitespace-nowrap">{`Обработано: ${processedCount}/${total}`}</span>}
              {processingCount > 0 && <span className="whitespace-nowrap">{`В работе: ${processingCount}`}</span>}
              {pendingCount > 0 && <span className="whitespace-nowrap">{`В очереди: ${pendingCount}`}</span>}
              <span className={cn('whitespace-nowrap font-medium', successCount > 0 && 'text-emerald-500')}>
                {`Успешно: ${successCount}`}
              </span>
              {failedCount > 0 && (
                <span className="whitespace-nowrap font-medium text-rose-500">{`Ошибок: ${failedCount}`}</span>
              )}
              {hasSkipped && skippedLabel && (
                <span
                  className="max-w-full text-amber-500"
                  title={skippedPreviewRaw}
                >
                  {`Пропущены: ${skippedLabel}`}
                </span>
              )}
            </div>
          )}
        </div>
      )
    },
    sortable: true,
    sortValue: (item: Task) => STATUS_WEIGHTS[item.status] ?? Number.POSITIVE_INFINITY,
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
