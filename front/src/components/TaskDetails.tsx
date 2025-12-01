import { useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { TaskDetails as TaskDetailsType } from '../types'
import { getTaskStatusText, getGroupStatusText } from '../utils/statusHelpers'
import { calculateTaskProgress } from '../utils/taskProgress'
import ProgressBar from './ProgressBar'
import { Button } from './ui/button'
import { useTasksStore } from '../stores'

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

const STATUS_BADGE_BASE = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide'

const taskStatusClasses: Record<TaskStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  processing: 'bg-blue-500/10 text-blue-500',
  running: 'bg-blue-500/10 text-blue-500',
  completed: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
}

const groupStatusClasses: Record<GroupStatus, string> = {
  pending: 'text-yellow-500',
  processing: 'text-blue-500',
  running: 'text-blue-500',
  success: 'text-green-500',
  failed: 'text-red-500',
}

function TaskDetails({ task, onClose }: TaskDetailsProps) {
  const resumeTask = useTasksStore((state) => state.resumeTask)
  const checkTask = useTasksStore((state) => state.checkTask)
  const fetchTaskDetails = useTasksStore((state) => state.fetchTaskDetails)
  const [isResuming, setIsResuming] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  if (!task) return null

  const overallProgress = calculateTaskProgress(task)
  const canResume = task.status !== 'completed'

  const handleResume = async () => {
    if (!canResume || isResuming) {
      return
    }

    setIsResuming(true)
    try {
      const success = await resumeTask(task.id)
      if (success) {
        void fetchTaskDetails(task.id)
      }
    } finally {
      setIsResuming(false)
    }
  }

  const handleCheck = async () => {
    if (isChecking) {
      return
    }

    setIsChecking(true)
    try {
      const success = await checkTask(task.id)
      if (success) {
        void fetchTaskDetails(task.id)
      }
    } finally {
      setIsChecking(false)
    }
  }

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
        <div className="w-full max-w-[240px] space-y-1.5">
          <ProgressBar
            current={indeterminate ? 1 : safeCurrent}
            total={indeterminate ? 1 : safeTotal}
            size="small"
            tone={tone}
            showLabel={false}
            indeterminate={indeterminate}
            className="h-1.5"
          />
          <div className="flex items-center justify-between text-xs">
             <span className="font-medium text-white">{labelText}</span>
             {detail}
          </div>
        </div>
      )
    }

    if (group.status === 'success') {
      const commentsCount = parsedData ? getNumberFromObject(parsedData, 'commentsCount', 'comments') : null
      const posts = parsedData ? getNumberFromObject(parsedData, 'postsCount', 'posts') : null
      
      let detail = ''
      if (commentsCount !== null && posts !== null) {
        detail = `${posts} п. / ${commentsCount} ком.`
      } else if (commentsCount !== null) {
        detail = `${commentsCount} ком.`
      } else if (posts !== null) {
        detail = `${posts} п.`
      }

      return renderProgress('success', 1, 1, '100%', <span className="text-gray-400">{detail}</span>)
    }

    if (group.status === 'failed') {
      return renderProgress('danger', 1, 1, 'Ошибка', <span className="text-red-400 truncate max-w-[120px]">{group.error ?? 'Сбой'}</span>)
    }

    if (group.status === 'pending') {
      return <span className="text-sm text-gray-500">В очереди</span>
    }

    if (group.status === 'processing' || group.status === 'running') {
      const progressInfo = resolveGroupProgress(group, parsedData)

      if (!progressInfo) {
        return renderProgress('primary', 0, 1, 'Обработка...', <span className="text-gray-400">...</span>, true)
      }

      let barTotal = progressInfo.total != null && progressInfo.total > 0 ? progressInfo.total : progressInfo.percent != null ? 100 : 1
      let barCurrent = 0

      if (progressInfo.total != null && progressInfo.total > 0) {
        if (progressInfo.processed != null) {
          barCurrent = clamp(progressInfo.processed, 0, progressInfo.total)
        } else if (progressInfo.percent != null) {
          barCurrent = clamp((progressInfo.percent / 100) * progressInfo.total, 0, progressInfo.total)
        }
      } else if (progressInfo.percent != null) {
        barCurrent = clamp(progressInfo.percent, 0, 100)
        barTotal = 100
      }

      const percentText = progressInfo.percent != null
        ? `${Math.round(progressInfo.percent)}%`
        : '...'

      const hasConcreteProgress = progressInfo.percent != null || progressInfo.processed != null || progressInfo.total != null

      return renderProgress('primary', hasConcreteProgress ? barCurrent : 0, hasConcreteProgress ? barTotal : 1, percentText, <span className="text-gray-400">Парсинг...</span>, !hasConcreteProgress)
    }

    return <span className="text-gray-500">—</span>
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="flex w-full max-h-[90vh] max-w-5xl flex-col overflow-hidden rounded-3xl bg-[#0F1115] text-white shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-4 px-8 py-6 border-b border-white/10">
          <h2 className="text-2xl font-bold tracking-tight text-white">Детали задачи #{task.id}</h2>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              disabled={isResuming || !canResume}
              onClick={handleResume}
              className="bg-[#1C1F26] text-white hover:bg-[#252932] border-transparent"
              title={canResume ? undefined : 'Завершённую задачу возобновлять не требуется'}
            >
              {isResuming ? 'Возобновление…' : 'Продолжить'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleCheck}
              disabled={isChecking}
              className="bg-[#1C1F26] text-white hover:bg-[#252932] border-transparent"
            >
              {isChecking ? 'Проверяем…' : 'Проверить'}
            </Button>
            <button
              type="button"
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              onClick={onClose}
              aria-label="Закрыть"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Top Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
             <div className="rounded-2xl border border-white/5 bg-[#181B21] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Название</p>
              <p className="text-sm font-medium text-white truncate" title={task.title}>{task.title || 'Без названия'}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#181B21] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Статус</p>
              <span className={`${STATUS_BADGE_BASE} ${taskStatusClasses[task.status]}`}>
                {getTaskStatusText(task.status)}
              </span>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#181B21] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Охват</p>
              <p className="text-sm font-medium text-white truncate">{scopeLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#181B21] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Создана</p>
              <p className="text-sm font-medium text-white">{formatDate(task.createdAt)}</p>
            </div>
             <div className="rounded-2xl border border-white/5 bg-[#181B21] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Лимит постов</p>
              <p className="text-sm font-medium text-white">{task.postLimit ?? '—'}</p>
            </div>
             <div className="rounded-2xl border border-white/5 bg-[#181B21] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Всего групп</p>
              <p className="text-sm font-medium text-white">{totalGroups}</p>
            </div>
             <div className="rounded-2xl border border-white/5 bg-[#181B21] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Постов</p>
              <p className="text-sm font-medium text-white">{postsCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#181B21] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Комментариев</p>
              <p className="text-sm font-medium text-white">{commentsCountTotal ?? 0}</p>
            </div>
          </div>

          {/* Main Progress Section */}
          {totalGroups > 0 && (
            <div className="rounded-2xl border border-white/5 bg-[#181B21] p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Прогресс</span>
                <span className="text-sm font-medium text-gray-400">{processedTotal} / {totalGroups}</span>
              </div>
              <ProgressBar
                current={processedTotal}
                total={totalGroups}
                showLabel={false}
                tone={processedTotal >= totalGroups && totalGroups > 0 ? 'success' : 'primary'}
                className="h-2 mb-4"
              />
              <div className="text-xs font-medium text-gray-500 mb-6">
                {Math.round(totalGroups > 0 ? (processedTotal / totalGroups) * 100 : 0)}%
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                 <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">В работе</p>
                  <p className="text-lg font-semibold text-white">{activeGroups}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">В очереди</p>
                   <p className="text-lg font-semibold text-white">{pendingGroups}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Успешно</p>
                   <p className="text-lg font-semibold text-white">{successCount ?? 0}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Ошибок</p>
                   <p className="text-lg font-semibold text-white">{failedCount ?? 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Groups Table */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Группы</h3>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#131519]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#1C1F26] text-xs font-bold uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-6 py-4 w-16">№</th>
                    <th className="px-6 py-4">Название группы</th>
                    <th className="px-6 py-4 w-32">Статус</th>
                    <th className="px-6 py-4 w-64 text-right">Результат</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {task.groups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Нет данных по группам
                      </td>
                    </tr>
                  ) : (
                    task.groups.map((group, index) => (
                      <tr key={`${group.groupId}-${index}`} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 font-medium text-white max-w-[300px] truncate" title={group.groupName || undefined}>
                          {group.groupName}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold uppercase tracking-wide ${groupStatusClasses[group.status]}`}>
                            {getGroupStatusText(group.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex justify-end">
                          {renderGroupResult(group)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetails
