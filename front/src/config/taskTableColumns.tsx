import ProgressBar from '../components/ProgressBar'
import TaskActionsCell from '../pages/Tasks/components/TaskActionsCell'
import { getTaskStatusText } from '../utils/statusHelpers'
import { calculateTaskProgress } from '../utils/taskProgress'
import type { TableColumn, Task } from '../types'

const dateFormatter = new Intl.DateTimeFormat('ru-RU')

const toNumber = (value: unknown): number | null =>
  typeof value === 'number' ? value : null

const resolveNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const numeric = toNumber(value)
    if (numeric != null) {
      return numeric
    }
  }

  return null
}

const formatPair = (left: number | null, right: number | null): string =>
  `${left ?? '—'} / ${right ?? '—'}`

const formatDate = (value?: string | null): string => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

const formatResult = (item: Task): string => {
  const posts = toNumber(item.stats?.posts)
  const comments = toNumber(item.stats?.comments)

  if (posts !== null || comments !== null) {
    return formatPair(posts, comments)
  }

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

const STATUS_WEIGHTS: Record<Task['status'], number> = {
  pending: 0,
  processing: 1,
  running: 2,
  completed: 3,
  failed: 4,
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
      const totalNormalized = total > 0 ? total : null

      const scopeLabel = (() => {
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
      })()

      const postLimitValue = typeof item.postLimit === 'number' && Number.isFinite(item.postLimit)
        ? item.postLimit
        : null

      const skippedPreviewRaw = typeof item.skippedGroupsMessage === 'string'
        ? item.skippedGroupsMessage.trim()
        : ''
      const hasSkipped = skippedPreviewRaw.length > 0
      const skippedLabel = hasSkipped
        ? (skippedPreviewRaw.length > 80
          ? `${skippedPreviewRaw.slice(0, 80).trim()}…`
          : skippedPreviewRaw)
        : null

      const hasMeta =
        total > 0 ||
        successCount > 0 ||
        failedCount > 0 ||
        processingCount > 0 ||
        pendingCount > 0 ||
        scopeLabel !== null ||
        postLimitValue !== null ||
        hasSkipped

      const progressTone = failedCount > 0 && processedCount >= total
        ? 'danger'
        : processedCount >= total
          ? 'success'
          : 'primary'

      return (
        <div className="task-status-cell">
          <span className={`status-badge status-${item.status}`}>
            {getTaskStatusText(item.status)}
          </span>
          {total > 0 && (
            <ProgressBar
              current={processedCount}
              total={total}
              size="small"
              showLabel={false}
              tone={progressTone}
              className="task-status-progress"
            />
          )}
          {hasMeta && (
            <div className="task-status-meta">
              {scopeLabel && <span>{scopeLabel}</span>}
              {postLimitValue !== null && <span>{`Лимит постов: ${postLimitValue}`}</span>}
              {total > 0 && <span>{`Обработано: ${processedCount}/${total}`}</span>}
              {processingCount > 0 && <span>{`В работе: ${processingCount}`}</span>}
              {pendingCount > 0 && <span>{`В очереди: ${pendingCount}`}</span>}
              <span className={successCount > 0 ? 'success-text' : undefined}>{`Успешно: ${successCount}`}</span>
              {failedCount > 0 && <span className="error-text">{`Ошибок: ${failedCount}`}</span>}
              {hasSkipped && skippedLabel && (
                <span
                  className="task-status-meta__note warning-text"
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
