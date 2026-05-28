import type { TaskDetails as TaskDetailsType } from '@/types'
import { useTaskActions } from './TaskDetails/hooks/useTaskActions'
import { useTaskStats } from './TaskDetails/hooks/useTaskStats'
import { TaskStatsGrid } from './TaskDetails/components/TaskStatsGrid'
import { TaskProgressSection } from './TaskDetails/components/TaskProgressSection'
import { GroupsTable } from './TaskDetails/components/GroupsTable/GroupsTable'
import { FormModal } from '@/components/common/FormModal'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

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
