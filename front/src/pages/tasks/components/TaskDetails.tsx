import { Play, RefreshCw, RotateCcw } from 'lucide-react'
import type { TaskDetails as TaskDetailsType } from '@/shared/types'
import { Button } from '@/shared/components/ui/button'
import { useTaskDetailsActions } from '@/pages/tasks/hooks/useTaskDetailsActions'
import { useTaskStats } from '@/pages/tasks/hooks/useTaskStats'
import {
  getTaskStatusText,
  STATUS_BADGE_BASE,
  TASK_STATUS_BADGE,
} from '@/pages/tasks/utils/statusHelpers'
import { GroupsTable } from './GroupsTable'
import TaskModalShell from './TaskModalShell'
import { TaskProgressSection } from './TaskProgressSection'
import { TaskStatsGrid } from './TaskStatsGrid'

export { TaskStatsGrid } from './TaskStatsGrid'

interface TaskDetailsProps {
  task: TaskDetailsType | undefined
  onClose: () => void
}

function TaskDetails({ task, onClose }: TaskDetailsProps) {
  const { isResuming, isChecking, canResume, handleResume, handleCheck } =
    useTaskDetailsActions(task)
  const stats = useTaskStats(task)

  if (!task || !stats) return null

  const progressPercent =
    stats.totalGroups > 0 ? Math.round((stats.processedTotal / stats.totalGroups) * 100) : 0
  const isFinished = task.status === 'completed' || task.status === 'failed'

  return (
    <TaskModalShell
      open={!!task}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={`Задача #${task.id}`}
      description={task.title || 'Детали выполнения и результаты по группам'}
      icon={<Play className="h-5 w-5" />}
      widthClass="max-w-6xl"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${STATUS_BADGE_BASE} ${TASK_STATUS_BADGE[task.status]}`}>
              {getTaskStatusText(task.status)}
            </span>
            <span className="font-monitoring-body text-sm text-text-secondary">
              {isFinished
                ? `Завершено ${stats.processedTotal} из ${stats.totalGroups}`
                : `Выполнено ${progressPercent}%`}
            </span>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="h-10">
              Закрыть
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isResuming || !canResume}
              onClick={handleResume}
              className="h-10"
              title={canResume ? undefined : 'Завершённую задачу возобновлять не требуется'}
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              {isResuming ? 'Возобновление...' : 'Продолжить'}
            </Button>
            <Button type="button" onClick={handleCheck} disabled={isChecking} className="h-10">
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              {isChecking ? 'Проверяем...' : 'Проверить'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <TaskProgressSection
            totalGroups={stats.totalGroups}
            processedTotal={stats.processedTotal}
            activeGroups={stats.activeGroups}
            pendingGroups={stats.pendingGroups}
            successCount={stats.successCount}
            failedCount={stats.failedCount}
          />

          <div className="rounded-card border border-border/70 bg-background-primary/45 p-4">
            <p className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Кратко
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="font-mono-accent text-2xl font-semibold text-text-light">
                  {stats.totalGroups}
                </p>
                <p className="font-monitoring-body text-xs text-text-secondary">групп</p>
              </div>
              <div>
                <p className="font-mono-accent text-2xl font-semibold text-accent-success">
                  {stats.successCount}
                </p>
                <p className="font-monitoring-body text-xs text-text-secondary">успешно</p>
              </div>
              <div>
                <p className="font-mono-accent text-2xl font-semibold text-accent-primary">
                  {stats.activeGroups}
                </p>
                <p className="font-monitoring-body text-xs text-text-secondary">в работе</p>
              </div>
              <div>
                <p className="font-mono-accent text-2xl font-semibold text-accent-danger">
                  {stats.failedCount}
                </p>
                <p className="font-monitoring-body text-xs text-text-secondary">ошибок</p>
              </div>
            </div>
          </div>
        </section>

        <TaskStatsGrid
          task={task}
          scopeLabel={stats.scopeLabel}
          modeLabel={stats.modeLabel}
          totalGroups={stats.totalGroups}
          postsCount={stats.postsCount}
          commentsCountTotal={stats.commentsCountTotal}
        />

        <GroupsTable groups={task.groups} />
      </div>
    </TaskModalShell>
  )
}

export default TaskDetails
