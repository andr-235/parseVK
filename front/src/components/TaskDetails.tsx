import type { ReactNode } from 'react'
import type { TaskDetails as TaskDetailsType } from '../types'
import { getTaskStatusText, getGroupStatusText } from '../utils/statusHelpers'
import { calculateTaskProgress } from '../utils/taskProgress'
import ProgressBar from './ProgressBar'
import '../App.css'

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
        <div className="group-progress">
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

      let detail: ReactNode = <span className="group-progress__status success-text">Данные получены</span>

      if (commentsCount !== null && posts !== null) {
        detail = <span className="group-progress__status success-text">Постов: {posts} / Комментариев: {commentsCount}</span>
      } else if (commentsCount !== null) {
        detail = <span className="group-progress__status success-text">Комментариев: {commentsCount}</span>
      } else if (posts !== null) {
        detail = <span className="group-progress__status success-text">Постов: {posts}</span>
      }

      return renderProgress('success', 1, 1, 'Готово', detail)
    }

    if (group.status === 'failed') {
      const detail = <span className="group-progress__status error-text">{group.error ?? 'Ошибка парсинга'}</span>
      return renderProgress('danger', 1, 1, 'Ошибка', detail)
    }

    if (group.status === 'pending') {
      const detail = <span className="group-progress__status">Ждёт обработки</span>
      return renderProgress('primary', 0, 1, 'В очереди', detail)
    }

    if (group.status === 'processing' || group.status === 'running') {
      const progressInfo = resolveGroupProgress(group, parsedData)

      if (!progressInfo) {
        return renderProgress('primary', 0, 1, 'Обработка...', <span className="group-progress__status">Парсим посты...</span>, true)
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
        <span className="group-progress__status">
          {infoParts.length > 0 ? infoParts.join(' • ') : 'Посты обрабатываются'}
        </span>
      )

      const hasConcreteProgress = progressInfo.percent != null || progressInfo.processed != null || progressInfo.total != null

      return renderProgress('primary', hasConcreteProgress ? barCurrent : 0, hasConcreteProgress ? barTotal : 1, labelText, detail, !hasConcreteProgress)
    }

    return '—'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Детали задачи #{task.id}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="task-info">
            {task.title && (
              <div className="info-row">
                <span className="info-label">Название:</span>
                <span>{task.title}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Статус:</span>
              <span className={`status-badge status-${task.status}`}>
                {getTaskStatusText(task.status)}
              </span>
            </div>
            {scopeLabel && (
              <div className="info-row">
                <span className="info-label">Охват:</span>
                <span>{scopeLabel}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Создана:</span>
              <span>{formatDate(task.createdAt)}</span>
            </div>
            {task.completedAt && (
              <div className="info-row">
                <span className="info-label">Завершена:</span>
                <span>{formatDate(task.completedAt)}</span>
              </div>
            )}
            {task.postLimit != null && Number.isFinite(task.postLimit) && (
              <div className="info-row">
                <span className="info-label">Лимит постов:</span>
                <span>{task.postLimit}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Всего групп:</span>
              <span>{totalGroups}</span>
            </div>
            {totalGroups > 0 && (
              <div className="info-row info-row--column">
                <div className="info-row__header">
                  <span className="info-label">Прогресс:</span>
                  <span>{processedTotal} / {totalGroups}</span>
                </div>
                <ProgressBar
                  current={processedTotal}
                  total={totalGroups}
                  showLabel
                  label={`${Math.round(totalGroups > 0 ? (processedTotal / totalGroups) * 100 : 0)}%`}
                  tone={processedTotal >= totalGroups && totalGroups > 0 ? 'success' : 'primary'}
                />
              </div>
            )}
            {activeGroups > 0 && (
              <div className="info-row">
                <span className="info-label">В работе:</span>
                <span>{activeGroups}</span>
              </div>
            )}
            {pendingGroups > 0 && (
              <div className="info-row">
                <span className="info-label">В очереди:</span>
                <span>{pendingGroups}</span>
              </div>
            )}
            {successCount !== null && (
              <div className="info-row">
                <span className="info-label">Успешно:</span>
                <span className="success-text">{successCount}</span>
              </div>
            )}
            {failedCount !== null && (
              <div className="info-row">
                <span className="info-label">Ошибок:</span>
                <span className="error-text">{failedCount}</span>
              </div>
            )}
            {postsCount !== null && (
              <div className="info-row">
                <span className="info-label">Постов:</span>
                <span>{postsCount}</span>
              </div>
            )}
            {commentsCountTotal !== null && (
              <div className="info-row">
                <span className="info-label">Комментариев:</span>
                <span>{commentsCountTotal}</span>
              </div>
            )}
            {authorsCount !== null && (
              <div className="info-row">
                <span className="info-label">Авторов:</span>
                <span>{authorsCount}</span>
              </div>
            )}
            {task.skippedGroupsMessage && (
              <div className="info-row info-row--column">
                <span className="info-label">Пропущенные группы:</span>
                <span className="warning-text">{task.skippedGroupsMessage}</span>
              </div>
            )}
          </div>

          <h3>Группы</h3>
          <table className="keywords-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Название группы</th>
                <th>Статус</th>
                <th>Результат</th>
              </tr>
            </thead>
            <tbody>
              {task.groups.length === 0 ? (
                <tr>
                  <td colSpan={4}>Нет данных по группам</td>
                </tr>
              ) : (
                task.groups.map((group, index) => (
                  <tr key={`${group.groupId}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{group.groupName}</td>
                    <td>
                      <span className={`status-badge status-${group.status}`}>
                        {getGroupStatusText(group.status)}
                      </span>
                    </td>
                    <td>{renderGroupResult(group)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TaskDetails
