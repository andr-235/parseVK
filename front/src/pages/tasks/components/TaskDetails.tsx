import { Play } from 'lucide-react'
import type { TaskDetails as TaskDetailsType } from '@/shared/types'
import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/components/ui/sheet'
import { useTaskDetailsActions } from '@/pages/tasks/hooks/useTaskDetailsActions'
import { useTaskStats } from '@/pages/tasks/hooks/useTaskStats'
import { TaskStatsGrid } from './TaskStatsGrid'
import { TaskProgressSection } from './TaskProgressSection'
import { GroupsTable } from './GroupsTable'

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

  return (
    <Sheet
      open={!!task}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-y-auto">
        <SheetHeader className="border-b border-border/50 px-5 py-4 space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background-primary text-accent-primary">
                <Play className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="font-monitoring-display text-base font-semibold text-text-light truncate">
                  Детали задачи #{task.id}
                </SheetTitle>
                <SheetDescription className="font-monitoring-body text-xs text-text-secondary mt-0.5">
                  Статистика выполнения и прогресс парсинга по группам
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                disabled={isResuming || !canResume}
                onClick={handleResume}
                className="h-8 text-xs border border-border/60 bg-background-secondary text-text-secondary hover:bg-background-primary hover:text-text-light"
                title={canResume ? undefined : 'Завершённую задачу возобновлять не требуется'}
              >
                {isResuming ? 'Возобновление…' : 'Продолжить'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCheck}
                disabled={isChecking}
                className="h-8 text-xs text-text-secondary hover:bg-background-primary hover:text-text-light"
              >
                {isChecking ? 'Проверяем…' : 'Проверить'}
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
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
      </SheetContent>
    </Sheet>
  )
}

export default TaskDetails
