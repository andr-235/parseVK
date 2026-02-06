import type { TaskDetails as TaskDetailsType } from '@/types'
import { useTaskActions } from './TaskDetails/hooks/useTaskActions'
import { useTaskStats } from './TaskDetails/hooks/useTaskStats'
import { TaskDetailsHeader } from './TaskDetails/components/TaskDetailsHeader'
import { TaskStatsGrid } from './TaskDetails/components/TaskStatsGrid'
import { TaskProgressSection } from './TaskDetails/components/TaskProgressSection'
import { GroupsTable } from './TaskDetails/components/GroupsTable/GroupsTable'

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="flex w-full max-h-[90vh] max-w-5xl flex-col overflow-hidden rounded-3xl glassmorphic-surface text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <TaskDetailsHeader
          taskId={task.id}
          isResuming={isResuming}
          isChecking={isChecking}
          canResume={canResume}
          onResume={handleResume}
          onCheck={handleCheck}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <TaskStatsGrid
            task={task}
            scopeLabel={stats.scopeLabel}
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
      </div>
    </div>
  )
}

export default TaskDetails
