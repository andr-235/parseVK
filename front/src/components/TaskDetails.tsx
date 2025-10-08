import type { ReactNode } from 'react'
import type { TaskDetails as TaskDetailsType } from '../types'
import { getTaskStatusText, getGroupStatusText } from '../utils/statusHelpers'
import { calculateTaskProgress } from '../utils/taskProgress'
import ProgressBar from './ProgressBar'

interface TaskDetailsProps {
  task: TaskDetailsType | undefined
  onClose: () => void
}

const formatDate = (value: string) => new Date(value).toLocaleString('ru-RU')

const getNumberFromObject = (source: Record<string, unknown>, ...keys: string[]): number | null => {
  for (const key of keys) {
    if (!(key in source)) {
      continue
    }

    const raw = source[key]
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw
    }
    if (typeof raw === 'string' && raw.trim() !== '') {
      const parsed = Number(raw)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
  }

  return null
}

type TaskStatus = TaskDetailsType['status']
type GroupStatus = TaskDetailsType['groups'][number]['status']

const STATUS_BADGE_BASE = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide'

const taskStatusClasses: Record<TaskStatus, string> = {
  pending: 'bg-accent-warning/20 text-accent-warning',
  processing: 'bg-accent-primary/20 text-accent-primary',
  running: 'bg-accent-primary/20 text-accent-primary',
  completed: 'bg-accent-success/20 text-accent-success',
  failed: 'bg-accent-danger/20 text-accent-danger',
}

const groupStatusClasses: Record<GroupStatus, string> = {
  pending: 'bg-accent-warning/20 text-accent-warning',
  processing: 'bg-accent-primary/20 text-accent-primary',
  running: 'bg-accent-primary/20 text-accent-primary',
  success: 'bg-accent-success/20 text-accent-success',
  failed: 'bg-accent-danger/20 text-accent-danger',
}

function TaskDetails({ task, onClose }: TaskDetailsProps) {
  if (!task) return null

  const overallProgress = calculateTaskProgress(task)

  const scopeLabel = (() => {
    if (!task.scope) {
      return null
    }

    const normalizedScope = typeof task.scope === 'string' ? task.scope.toUpperCase() : task.scope

    if (normalizedScope === 'ALL') {
      return 'Все группы'
    }

    if (normalizedScope === 'SELECTED') {
      const selectedCount = Array.isArray(task.groupIds) ? task.groupIds.length : task.groupsCount
      return `Выбранные группы${selectedCount ? ` (${selectedCount})` : ''}`
    }

    return task.scope
  })()

  const successCount = overallProgress.success
  const failedCount = overallProgress.failed
  const processingCountStat = overallProgress.processing
  const pendingCountStat = overallProgress.pending

  const postsCount = typeof task.stats?.posts === 'number' ? task.stats.posts : null
  const commentsCountTotal = typeof task.stats?.comments === 'number' ? task.stats.comments : null
  const authorsCount = typeof task.stats?.authors === 'number' ? task.stats.authors : null

  const groupStatusDistribution = task.groups.reduce<Record<TaskDetailsType['groups'][number]['status'], number>>((acc, groupItem) => {
    acc[groupItem.status] = (acc[groupItem.status] ?? 0) + 1
    return acc
  }, {
    pending: 0,
    processing: 0,
    running: 0,
    success: 0,
    failed: 0
  })

  const fallbackGroupTotal = Math.max(
    typeof task.groupsCount === 'number' ? task.groupsCount : 0,
    task.groups.length,
    overallProgress.processed + overallProgress.processing + overallProgress.pending
  )
  const totalGroups = overallProgress.total > 0 ? overallProgress.total : fallbackGroupTotal
  const successTotal = Math.max(Math.min(successCount, totalGroups), 0)
  const failedTotal = Math.max(Math.min(failedCount, totalGroups), 0)
  const processedTotal = Math.min(
    Math.max(overallProgress.processed, successTotal + failedTotal),
    totalGroups
  )
  const inProgressFromGroups = groupStatusDistribution.processing + groupStatusDistribution.running
  const activeGroups = inProgressFromGroups > 0
    ? inProgressFromGroups
    : processingCountStat > 0
      ? Math.min(processingCountStat, totalGroups - processedTotal + processingCountStat)
      : 0
  const pendingGroupsCalculated = pendingCountStat > 0
    ? Math.min(pendingCountStat, totalGroups)
    : Math.max(totalGroups - processedTotal - activeGroups, 0)
  const pendingGroups = groupStatusDistribution.pending > 0
    ? groupStatusDistribution.pending
    : pendingGroupsCalculated

  const pickNumber = (...values: Array<number | null | undefined>): number | null => {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value
      }
    }

    return null
  }

  const clamp = (value: number, min: number, max: number): number => {
    if (Number.isNaN(value)) {
      return min
    }
    return Math.max(min, Math.min(max, value))
  }

  const resolveGroupProgress = (
    group: TaskDetailsType['groups'][number],
    parsedData: Record<string, unknown> | null
  ) => {
    const statsData = parsedData && typeof parsedData.stats === 'object'
      ? (parsedData.stats as Record<string, unknown>)
      : null

    const percent = pickNumber(
      group.progressPercent ?? null,
      parsedData ? getNumberFromObject(parsedData, 'progressPercent', 'progress', 'percentage', 'percent') : null,
      statsData ? getNumberFromObject(statsData, 'progressPercent', 'progress', 'percentage', 'percent') : null
    )

    const processed = pickNumber(
      group.processedCount ?? null,
      parsedData ? getNumberFromObject(parsedData, 'processedPosts', 'processed', 'processedCount', 'completedPosts', 'parsedPosts', 'done', 'completed', 'parsed') : null,
      statsData ? getNumberFromObject(statsData, 'processedPosts', 'processed', 'processedCount', 'completedPosts', 'parsedPosts', 'done', 'completed', 'parsed') : null
    )

    const total = pickNumber(
      group.totalCount ?? null,
      parsedData ? getNumberFromObject(parsedData, 'totalPosts', 'total', 'totalCount', 'postsTotal', 'targetPosts', 'plannedPosts', 'expectedPosts', 'maxPosts') : null,
      statsData ? getNumberFromObject(statsData, 'totalPosts', 'total', 'totalCount', 'postsTotal', 'targetPosts', 'plannedPosts', 'expectedPosts', 'maxPosts') : null
    )

    const remaining = pickNumber(
      group.remainingCount ?? null,
      parsedData ? getNumberFromObject(parsedData, 'remainingPosts', 'remaining', 'left', 'pendingPosts') : null,
      statsData ? getNumberFromObject(statsData, 'remainingPosts', 'remaining', 'left', 'pendingPosts') : null
    )

    const current = pickNumber(
      group.currentIndex ?? null,
      parsedData ? getNumberFromObject(parsedData, 'currentPost', 'currentPostIndex', 'current', 'currentIndex', 'index', 'step') : null,
      statsData ? getNumberFromObject(statsData, 'currentPost', 'currentPostIndex', 'current', 'currentIndex', 'index', 'step') : null
    )

    const resolvedTotal = total ?? (processed != null && remaining != null ? processed + remaining : null)
    const resolvedProcessed = processed ?? (
      resolvedTotal != null && remaining != null
        ? Math.max(resolvedTotal - remaining, 0)
        : null
    )

    const resolvedPercent = percent ?? (
      resolvedTotal != null && resolvedProcessed != null && resolvedTotal > 0
        ? (resolvedProcessed / resolvedTotal) * 100
        : null
    )

    if (
      (resolvedPercent == null || Number.isNaN(resolvedPercent)) &&
      (resolvedProcessed == null || Number.isNaN(resolvedProcessed)) &&
      (resolvedTotal == null || Number.isNaN(resolvedTotal)) &&
      (current == null || Number.isNaN(current)) &&
      (remaining == null || Number.isNaN(remaining))
    ) {
      return null
    }

    return {
      percent: resolvedPercent != null ? clamp(resolvedPercent, 0, 100) : null,
      processed: resolvedProcessed != null ? Math.max(0, resolvedProcessed) : null,
      total: resolvedTotal != null ? Math.max(0, resolvedTotal) : null,
      current: current != null ? Math.max(0, current) : null,
      remaining: remaining != null ? Math.max(0, remaining) : null
    }
  }

  const renderGroupResult = (group: TaskDetailsType['groups'][number]) => {
    const parsedData = group.parsedData && typeof group.parsedData === 'object'
      ? (group.parsedData as Record<string, unknown>)
      : null

    const renderProgress = (
      tone: 'primary' | 'success' | 'warning' | 'danger',
      currentValue: number,
      totalValue: number,
      labelText: string,
      detail: ReactNode,
      indeterminate = false
    ) => {
      const safeTotal = totalValue > 0 ? totalValue : 1
      const safeCurrent = clamp(currentValue, 0, safeTotal)

      return (
        <div className="space-y-2 rounded-xl border border-border/60 bg-background-primary/40 p-4">
          <ProgressBar
            current={indeterminate ? 1 : safeCurrent}
            total={indeterminate ? 1 : safeTotal}
            size="small"
            tone={tone}
            label={labelText}
            showLabel
            indeterminate={indeterminate}
          />
          {detail}
        </div>
      )
    }

    if (group.status === 'success') {
      const commentsCount = parsedData ? getNumberFromObject(parsedData, 'commentsCount', 'comments') : null
      const posts = parsedData ? getNumberFromObject(parsedData, 'postsCount', 'posts') : null

      let detail: ReactNode = <span className="text-sm font-medium text-accent-success">Данные получены</span>

      if (commentsCount !== null && posts !== null) {
        detail = <span className="text-sm font-medium text-accent-success">Постов: {posts} / Комментариев: {commentsCount}</span>
      } else if (commentsCount !== null) {
        detail = <span className="text-sm font-medium text-accent-success">Комментариев: {commentsCount}</span>
      } else if (posts !== null) {
        detail = <span className="text-sm font-medium text-accent-success">Постов: {posts}</span>
      }

      return renderProgress('success', 1, 1, 'Готово', detail)
    }

    if (group.status === 'failed') {
      const detail = <span className="text-sm font-medium text-accent-danger">{group.error ?? 'Ошибка парсинга'}</span>
      return renderProgress('danger', 1, 1, 'Ошибка', detail)
    }

    if (group.status === 'pending') {
      const detail = <span className="text-sm text-text-secondary">Ждёт обработки</span>
      return renderProgress('primary', 0, 1, 'В очереди', detail)
    }

    if (group.status === 'processing' || group.status === 'running') {
      const progressInfo = resolveGroupProgress(group, parsedData)

      if (!progressInfo) {
        return renderProgress('primary', 0, 1, 'Обработка...', <span className="text-sm text-text-secondary">Парсим посты...</span>, true)
      }

      const infoParts: string[] = []
      let barTotal = progressInfo.total != null && progressInfo.total > 0 ? progressInfo.total : progressInfo.percent != null ? 100 : 1
      let barCurrent = 0

      if (progressInfo.total != null && progressInfo.total > 0) {
        if (progressInfo.processed != null) {
          barCurrent = clamp(progressInfo.processed, 0, progressInfo.total)
        } else if (progressInfo.percent != null) {
          barCurrent = clamp((progressInfo.percent / 100) * progressInfo.total, 0, progressInfo.total)
        } else if (progressInfo.current != null) {
          barCurrent = clamp(progressInfo.current, 0, progressInfo.total)
        }
      } else if (progressInfo.percent != null) {
        barCurrent = clamp(progressInfo.percent, 0, 100)
        barTotal = 100
      }

      if (progressInfo.processed != null && progressInfo.total != null) {
        infoParts.push(`Готово: ${Math.min(progressInfo.processed, progressInfo.total)} / ${progressInfo.total}`)
      } else if (progressInfo.processed != null) {
        infoParts.push(`Готово: ${progressInfo.processed}`)
      }

      if (progressInfo.current != null) {
        const displayCurrent = progressInfo.total != null
          ? `${Math.min(progressInfo.current + 1, progressInfo.total)} / ${progressInfo.total}`
          : `${progressInfo.current + 1}`
        infoParts.push(`Текущий: ${displayCurrent}`)
      }

      if (progressInfo.remaining != null && progressInfo.remaining > 0) {
        infoParts.push(`Осталось: ${progressInfo.remaining}`)
      }

      const labelText = progressInfo.percent != null
        ? `${Math.round(progressInfo.percent)}%`
        : progressInfo.total != null && progressInfo.processed != null
          ? `${Math.min(progressInfo.processed, progressInfo.total)} / ${progressInfo.total}`
          : 'Обработка...'

      const detail = (
        <span className="text-sm text-text-secondary">
          {infoParts.length > 0 ? infoParts.join(' • ') : 'Посты обрабатываются'}
        </span>
      )

      const hasConcreteProgress = progressInfo.percent != null || progressInfo.processed != null || progressInfo.total != null

      return renderProgress('primary', hasConcreteProgress ? barCurrent : 0, hasConcreteProgress ? barTotal : 1, labelText, detail, !hasConcreteProgress)
    }

    return '—'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-h-[90vh] max-w-5xl flex-col overflow-hidden rounded-3xl bg-background-secondary text-text-primary shadow-soft-lg transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-8 py-6">
          <h2 className="text-2xl font-semibold tracking-tight">Детали задачи #{task.id}</h2>
          <button
            type="button"
            className="rounded-full bg-background-primary/40 p-2 text-2xl leading-none text-text-secondary transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <section className="grid gap-4 text-sm sm:grid-cols-2">
            {task.title && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Название</p>
                <p className="mt-1 text-base font-medium text-text-primary">{task.title}</p>
              </div>
            )}
            <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Статус</p>
              <span className={`${STATUS_BADGE_BASE} mt-2 ${taskStatusClasses[task.status]}`}>
                {getTaskStatusText(task.status)}
              </span>
            </div>
            {scopeLabel && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Охват</p>
                <p className="mt-1 text-base font-medium text-text-primary">{scopeLabel}</p>
              </div>
            )}
            <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Создана</p>
              <p className="mt-1 text-base font-medium text-text-primary">{formatDate(task.createdAt)}</p>
            </div>
            {task.completedAt && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Завершена</p>
                <p className="mt-1 text-base font-medium text-text-primary">{formatDate(task.completedAt)}</p>
              </div>
            )}
            {task.postLimit != null && Number.isFinite(task.postLimit) && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Лимит постов</p>
                <p className="mt-1 text-base font-medium text-text-primary">{task.postLimit}</p>
              </div>
            )}
            <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Всего групп</p>
              <p className="mt-1 text-base font-semibold text-text-primary">{totalGroups}</p>
            </div>
            {totalGroups > 0 && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-text-secondary">
                  <span>Прогресс</span>
                  <span>{processedTotal} / {totalGroups}</span>
                </div>
                <ProgressBar
                  className="mt-3"
                  current={processedTotal}
                  total={totalGroups}
                  showLabel
                  label={`${Math.round(totalGroups > 0 ? (processedTotal / totalGroups) * 100 : 0)}%`}
                  tone={processedTotal >= totalGroups && totalGroups > 0 ? 'success' : 'primary'}
                />
              </div>
            )}
            {activeGroups > 0 && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">В работе</p>
                <p className="mt-1 text-base font-medium text-text-primary">{activeGroups}</p>
              </div>
            )}
            {pendingGroups > 0 && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">В очереди</p>
                <p className="mt-1 text-base font-medium text-text-primary">{pendingGroups}</p>
              </div>
            )}
            {successCount !== null && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Успешно</p>
                <p className="mt-1 text-base font-semibold text-accent-success">{successCount}</p>
              </div>
            )}
            {failedCount !== null && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Ошибок</p>
                <p className="mt-1 text-base font-semibold text-accent-danger">{failedCount}</p>
              </div>
            )}
            {postsCount !== null && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Постов</p>
                <p className="mt-1 text-base font-medium text-text-primary">{postsCount}</p>
              </div>
            )}
            {commentsCountTotal !== null && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Комментариев</p>
                <p className="mt-1 text-base font-medium text-text-primary">{commentsCountTotal}</p>
              </div>
            )}
            {authorsCount !== null && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Авторов</p>
                <p className="mt-1 text-base font-medium text-text-primary">{authorsCount}</p>
              </div>
            )}
            {task.skippedGroupsMessage && (
              <div className="rounded-2xl border border-border/60 bg-background-primary/40 p-4 shadow-soft-sm sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Пропущенные группы</p>
                <p className="mt-1 text-sm font-medium text-accent-warning">{task.skippedGroupsMessage}</p>
              </div>
            )}
          </section>

          <section className="mt-10 space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">Группы</h3>
            <div className="overflow-hidden rounded-2xl border border-border bg-background-secondary shadow-soft-md">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-background-secondary/70 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="px-5 py-3">№</th>
                    <th className="px-5 py-3">Название группы</th>
                    <th className="px-5 py-3">Статус</th>
                    <th className="px-5 py-3">Результат</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {task.groups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-sm text-text-secondary">
                        Нет данных по группам
                      </td>
                    </tr>
                  ) : (
                    task.groups.map((group, index) => (
                      <tr key={`${group.groupId}-${index}`} className="transition-colors duration-150 hover:bg-background-primary/70">
                        <td className="px-5 py-4 align-top text-sm font-medium text-text-secondary">{index + 1}</td>
                        <td className="px-5 py-4 align-top text-sm font-medium text-text-primary">{group.groupName}</td>
                        <td className="px-5 py-4 align-top">
                          <span className={`${STATUS_BADGE_BASE} ${groupStatusClasses[group.status]}`}>
                            {getGroupStatusText(group.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">{renderGroupResult(group)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default TaskDetails
