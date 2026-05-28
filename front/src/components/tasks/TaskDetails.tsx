import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Play } from 'lucide-react'
import type { TaskDetails as TaskDetailsType } from '@/types'
import { useTaskDetails } from '@/hooks/tasks/useTaskDetails'
import { FormModal } from '@/components/common/FormModal'
import { Button } from '@/components/ui/button'
import ProgressBar from '@/components/common/ProgressBar'
import { formatDateTime } from '@/utils/common'
import { getTaskStatusText, getGroupStatusText } from '@/utils/tasks/statusHelpers'
import { calculateTaskProgress } from '@/utils/tasks/taskProgress'

// --- Formatters & Helper Utilities ---
const formatDate = (value: string): string => formatDateTime(value)

const getNumberFromObject = (
  source: Record<string, unknown>,
  ...keys: string[]
): number | null => {
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

interface GroupProgressInfo {
  percent: number | null
  processed: number | null
  total: number | null
  current: number | null
  remaining: number | null
}

const resolveGroupProgress = (
  group: TaskDetailsType['groups'][number],
  parsedData: Record<string, unknown> | null
): GroupProgressInfo | null => {
  const statsData =
    parsedData && typeof parsedData.stats === 'object'
      ? (parsedData.stats as Record<string, unknown>)
      : null

  const percent = pickNumber(
    group.progressPercent ?? null,
    parsedData
      ? getNumberFromObject(parsedData, 'progressPercent', 'progress', 'percentage', 'percent')
      : null,
    statsData
      ? getNumberFromObject(statsData, 'progressPercent', 'progress', 'percentage', 'percent')
      : null
  )

  const processed = pickNumber(
    group.processedCount ?? null,
    parsedData
      ? getNumberFromObject(
          parsedData,
          'processedPosts',
          'processed',
          'processedCount',
          'completedPosts',
          'parsedPosts',
          'done',
          'completed',
          'parsed'
        )
      : null,
    statsData
      ? getNumberFromObject(
          statsData,
          'processedPosts',
          'processed',
          'processedCount',
          'completedPosts',
          'parsedPosts',
          'done',
          'completed',
          'parsed'
        )
      : null
  )

  const total = pickNumber(
    group.totalCount ?? null,
    parsedData
      ? getNumberFromObject(
          parsedData,
          'totalPosts',
          'total',
          'totalCount',
          'postsTotal',
          'targetPosts',
          'plannedPosts',
          'expectedPosts',
          'maxPosts'
        )
      : null,
    statsData
      ? getNumberFromObject(
          statsData,
          'totalPosts',
          'total',
          'totalCount',
          'postsTotal',
          'targetPosts',
          'plannedPosts',
          'expectedPosts',
          'maxPosts'
        )
      : null
  )

  const remaining = pickNumber(
    group.remainingCount ?? null,
    parsedData
      ? getNumberFromObject(parsedData, 'remainingPosts', 'remaining', 'left', 'pendingPosts')
      : null,
    statsData
      ? getNumberFromObject(statsData, 'remainingPosts', 'remaining', 'left', 'pendingPosts')
      : null
  )

  const current = pickNumber(
    group.currentIndex ?? null,
    parsedData
      ? getNumberFromObject(
          parsedData,
          'currentPost',
          'currentPostIndex',
          'current',
          'currentIndex',
          'index',
          'step'
        )
      : null,
    statsData
      ? getNumberFromObject(
          statsData,
          'currentPost',
          'currentPostIndex',
          'current',
          'currentIndex',
          'index',
          'step'
        )
      : null
  )

  const resolvedTotal =
    total ?? (processed != null && remaining != null ? processed + remaining : null)
  const resolvedProcessed =
    processed ??
    (resolvedTotal != null && remaining != null ? Math.max(resolvedTotal - remaining, 0) : null)

  const resolvedPercent =
    percent ??
    (resolvedTotal != null && resolvedProcessed != null && resolvedTotal > 0
      ? (resolvedProcessed / resolvedTotal) * 100
      : null)

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
    remaining: remaining != null ? Math.max(0, remaining) : null,
  }
}

type TaskStatus = TaskDetailsType['status']
type GroupStatus = TaskDetailsType['groups'][number]['status']

const STATUS_BADGE_BASE =
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide'

const taskStatusClasses: Record<TaskStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  processing: 'bg-orange-500/10 text-orange-500',
  running: 'bg-orange-500/10 text-orange-500',
  completed: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
}

const groupStatusClasses: Record<GroupStatus, string> = {
  pending: 'text-yellow-500',
  processing: 'text-orange-500',
  running: 'text-orange-500',
  success: 'text-green-500',
  failed: 'text-red-500',
}

// --- Hooks ---
const useTaskActions = (task: TaskDetailsType | undefined) => {
  const { resumeTask, checkTask, fetchTaskDetails } = useTaskDetails()
  const [isResuming, setIsResuming] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const canResume = task?.status !== 'completed'

  const handleResume = async () => {
    if (!task || !canResume || isResuming) {
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
    if (!task || isChecking) {
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

  return {
    isResuming,
    isChecking,
    canResume,
    handleResume,
    handleCheck,
  }
}

const useTaskStats = (task: TaskDetailsType | undefined) => {
  return useMemo(() => {
    if (!task) {
      return null
    }

    const overallProgress = calculateTaskProgress(task)

    const modeLabel =
      task.mode === 'recheck_group'
        ? 'Перепроверка группы'
        : task.mode === 'recent_posts'
          ? 'Последние посты'
          : null

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

    const groupStatusDistribution = task.groups.reduce<
      Record<TaskDetailsType['groups'][number]['status'], number>
    >(
      (acc, groupItem) => {
        acc[groupItem.status] = (acc[groupItem.status] ?? 0) + 1
        return acc
      },
      {
        pending: 0,
        processing: 0,
        running: 0,
        success: 0,
        failed: 0,
      }
    )

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

    const inProgressFromGroups =
      groupStatusDistribution.processing + groupStatusDistribution.running
    const activeGroups =
      inProgressFromGroups > 0
        ? inProgressFromGroups
        : processingCountStat > 0
          ? Math.min(processingCountStat, totalGroups - processedTotal + processingCountStat)
          : 0

    const pendingGroupsCalculated =
      pendingCountStat > 0
        ? Math.min(pendingCountStat, totalGroups)
        : Math.max(totalGroups - processedTotal - activeGroups, 0)
    const pendingGroups =
      groupStatusDistribution.pending > 0
        ? groupStatusDistribution.pending
        : pendingGroupsCalculated

    return {
      overallProgress,
      scopeLabel,
      modeLabel,
      successCount,
      failedCount,
      processingCountStat,
      pendingCountStat,
      postsCount,
      commentsCountTotal,
      groupStatusDistribution,
      totalGroups,
      processedTotal,
      activeGroups,
      pendingGroups,
    }
  }, [task])
}

// --- Subcomponents ---

interface TaskStatsGridProps {
  task: TaskDetailsType
  scopeLabel: string | null
  modeLabel: string | null
  totalGroups: number
  postsCount: number | null
  commentsCountTotal: number | null
}

export const TaskStatsGrid = ({
  task,
  scopeLabel,
  modeLabel,
  totalGroups,
  postsCount,
  commentsCountTotal,
}: TaskStatsGridProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-accent-primary mb-1">
          Название
        </p>
        <p
          className="font-monitoring-body text-sm font-normal text-text-primary truncate"
          title={task.title || undefined}
        >
          {task.title || 'Без названия'}
        </p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Статус
        </p>
        <span
          className={`${STATUS_BADGE_BASE} ${taskStatusClasses[task.status]} font-monitoring-body text-xs font-semibold uppercase tracking-wider`}
        >
          {getTaskStatusText(task.status)}
        </span>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Охват
        </p>
        <p className="font-monitoring-body text-sm font-normal text-text-primary truncate">
          {scopeLabel}
        </p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Создана
        </p>
        <p className="font-mono-accent text-xs font-medium text-text-primary">
          {formatDate(task.createdAt)}
        </p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Режим
        </p>
        <p className="font-monitoring-body text-sm font-normal text-text-primary">
          {modeLabel ?? 'Последние посты'}
        </p>
      </div>
      {task.mode !== 'recheck_group' && (
        <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
          <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
            Лимит постов
          </p>
          <p className="font-mono-accent text-xs font-medium text-text-primary">
            {task.postLimit ?? '—'}
          </p>
        </div>
      )}
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Всего групп
        </p>
        <p className="font-mono-accent text-xs font-medium text-text-primary">{totalGroups}</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Постов
        </p>
        <p className="font-mono-accent text-xs font-medium text-text-primary">{postsCount ?? 0}</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-4">
        <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
          Комментариев
        </p>
        <p className="font-mono-accent text-xs font-medium text-text-primary">
          {commentsCountTotal ?? 0}
        </p>
      </div>
    </div>
  )
}

interface TaskProgressSectionProps {
  totalGroups: number
  processedTotal: number
  activeGroups: number
  pendingGroups: number
  successCount: number
  failedCount: number
}

const TaskProgressSection = ({
  totalGroups,
  processedTotal,
  activeGroups,
  pendingGroups,
  successCount,
  failedCount,
}: TaskProgressSectionProps) => {
  if (totalGroups === 0) {
    return null
  }

  const progressPercent = Math.round(totalGroups > 0 ? (processedTotal / totalGroups) * 100 : 0)

  return (
    <div className="rounded-2xl border border-border/50 bg-background-secondary/70 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="font-monitoring-body text-base font-semibold text-text-primary">
          Прогресс
        </span>
        <span className="font-mono-accent text-xs font-medium text-text-secondary">
          {processedTotal} / {totalGroups}
        </span>
      </div>
      <ProgressBar
        current={processedTotal}
        total={totalGroups}
        showLabel={false}
        tone={processedTotal >= totalGroups && totalGroups > 0 ? 'success' : 'primary'}
        className="h-2 mb-4"
      />
      <div className="font-mono-accent text-xs font-medium text-text-secondary mb-6">
        {progressPercent}%
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
        <div>
          <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
            В работе
          </p>
          <p className="font-mono-accent text-base font-semibold text-text-primary">
            {activeGroups}
          </p>
        </div>
        <div>
          <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
            В очереди
          </p>
          <p className="font-mono-accent text-base font-semibold text-text-primary">
            {pendingGroups}
          </p>
        </div>
        <div>
          <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
            Успешно
          </p>
          <p className="font-mono-accent text-base font-semibold text-text-primary">
            {successCount ?? 0}
          </p>
        </div>
        <div>
          <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
            Ошибок
          </p>
          <p className="font-mono-accent text-base font-semibold text-text-primary">
            {failedCount ?? 0}
          </p>
        </div>
      </div>
    </div>
  )
}

interface GroupProgressBarProps {
  tone: 'primary' | 'success' | 'warning' | 'danger'
  currentValue: number
  totalValue: number
  labelText: string
  detail: ReactNode
  indeterminate?: boolean
}

const GroupProgressBar = ({
  tone,
  currentValue,
  totalValue,
  labelText,
  detail,
  indeterminate = false,
}: GroupProgressBarProps) => {
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
        <span className="font-medium text-foreground">{labelText}</span>
        {detail}
      </div>
    </div>
  )
}

interface GroupResultCellProps {
  group: TaskDetailsType['groups'][number]
}

const GroupResultCell = ({ group }: GroupResultCellProps) => {
  const parsedData =
    group.parsedData && typeof group.parsedData === 'object'
      ? (group.parsedData as Record<string, unknown>)
      : null

  if (group.status === 'success') {
    const commentsCount = parsedData
      ? getNumberFromObject(parsedData, 'commentsCount', 'comments')
      : null
    const posts = parsedData ? getNumberFromObject(parsedData, 'postsCount', 'posts') : null

    let detail = ''
    if (commentsCount !== null && posts !== null) {
      detail = `${posts} п. / ${commentsCount} ком.`
    } else if (commentsCount !== null) {
      detail = `${commentsCount} ком.`
    } else if (posts !== null) {
      detail = `${posts} п.`
    }

    return (
      <GroupProgressBar
        tone="success"
        currentValue={1}
        totalValue={1}
        labelText="100%"
        detail={<span className="text-muted-foreground">{detail}</span>}
      />
    )
  }

  if (group.status === 'failed') {
    return (
      <GroupProgressBar
        tone="danger"
        currentValue={1}
        totalValue={1}
        labelText="Ошибка"
        detail={
          <span className="text-red-400 truncate max-w-[120px]">{group.error ?? 'Сбой'}</span>
        }
      />
    )
  }

  if (group.status === 'pending') {
    return <span className="text-sm text-muted-foreground">В очереди</span>
  }

  if (group.status === 'processing' || group.status === 'running') {
    const progressInfo = resolveGroupProgress(group, parsedData)

    if (!progressInfo) {
      return (
        <GroupProgressBar
          tone="primary"
          currentValue={0}
          totalValue={1}
          labelText="Обработка..."
          detail={<span className="text-muted-foreground">...</span>}
          indeterminate
        />
      )
    }

    let barTotal =
      progressInfo.total != null && progressInfo.total > 0
        ? progressInfo.total
        : progressInfo.percent != null
          ? 100
          : 1
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

    const percentText =
      progressInfo.percent != null ? `${Math.round(progressInfo.percent)}%` : '...'

    const hasConcreteProgress =
      progressInfo.percent != null || progressInfo.processed != null || progressInfo.total != null

    return (
      <GroupProgressBar
        tone="primary"
        currentValue={hasConcreteProgress ? barCurrent : 0}
        totalValue={hasConcreteProgress ? barTotal : 1}
        labelText={percentText}
        detail={<span className="text-muted-foreground">Парсинг...</span>}
        indeterminate={!hasConcreteProgress}
      />
    )
  }

  return <span className="text-muted-foreground">—</span>
}

interface GroupsTableProps {
  groups: TaskDetailsType['groups']
}

const GroupsTable = ({ groups }: GroupsTableProps) => {
  return (
    <div>
      <h3 className="font-monitoring-body text-base font-semibold text-text-primary mb-4">
        Группы
      </h3>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-background-secondary/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/70 font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary">
            <tr>
              <th className="px-6 py-4 w-16">№</th>
              <th className="px-6 py-4">Название группы</th>
              <th className="px-6 py-4 w-32">Статус</th>
              <th className="px-6 py-4 w-64 text-right">Результат</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {groups.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center font-monitoring-body text-sm font-normal text-text-secondary"
                >
                  Нет данных по группам
                </td>
              </tr>
            ) : (
              groups.map((group, index) => (
                <tr
                  key={`${group.groupId}-${index}`}
                  className="transition-colors hover:bg-muted/40"
                >
                  <td className="px-6 py-4 font-mono-accent text-xs font-medium text-text-secondary">
                    {index + 1}
                  </td>
                  <td
                    className="px-6 py-4 font-monitoring-body text-sm font-normal text-text-primary max-w-[300px] truncate"
                    title={group.groupName || undefined}
                  >
                    {group.groupName}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-monitoring-body text-xs font-semibold uppercase tracking-wider ${groupStatusClasses[group.status]}`}
                    >
                      {getGroupStatusText(group.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end">
                    <GroupResultCell group={group} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --- Main Exported Component ---
interface TaskDetailsProps {
  task: TaskDetailsType | undefined
  onClose: () => void
}

function TaskDetails({ task, onClose }: TaskDetailsProps) {
  const { isResuming, isChecking, canResume, handleResume, handleCheck } = useTaskActions(task)
  const stats = useTaskStats(task)

  if (!task || !stats) {
    return null
  }

  return (
    <FormModal
      isOpen={!!task}
      onClose={onClose}
      title={
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span>Детали задачи #{task.id}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isResuming || !canResume}
              onClick={handleResume}
              className="h-8 text-xs cursor-pointer border border-border bg-background-secondary text-text-secondary hover:bg-background-primary hover:text-text-light"
              title={canResume ? undefined : 'Завершённую задачу возобновлять не требуется'}
            >
              {isResuming ? 'Возобновление…' : 'Продолжить'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCheck}
              disabled={isChecking}
              className="h-8 text-xs cursor-pointer text-text-secondary hover:bg-background-primary hover:text-text-light"
            >
              {isChecking ? 'Проверяем…' : 'Проверить'}
            </Button>
          </div>
        </div>
      }
      description="Статистика выполнения и прогресс парсинга по группам"
      icon={<Play className="h-5 w-5" />}
      widthClass="max-w-5xl"
    >
      <div className="space-y-6 pt-2">
        <TaskStatsGrid
          task={task}
          scopeLabel={stats.scopeLabel}
          modeLabel={stats.modeLabel}
          totalGroups={stats.totalGroups}
          postsCount={stats.postsCount}
          commentsCountTotal={stats.commentsCountTotal}
        />

        <TaskProgressSection
          totalGroups={stats.totalGroups}
          processedTotal={stats.processedTotal}
          activeGroups={stats.activeGroups}
          pendingGroups={stats.pendingGroups}
          successCount={stats.successCount}
          failedCount={stats.failedCount}
        />

        <GroupsTable groups={task.groups} />
      </div>
    </FormModal>
  )
}

export default TaskDetails
