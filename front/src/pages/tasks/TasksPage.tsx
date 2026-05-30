import useTasksViewModel from '@/pages/tasks/hooks/useTasksViewModel'
import TaskDetails from '@/pages/tasks/components/TaskDetails'
import CreateParseTaskModal from '@/pages/tasks/components/CreateParseTaskModal'
import ActiveTasksBanner from '@/pages/tasks/components/ActiveTasksBanner'
import TasksList from '@/pages/tasks/components/TasksList'
import { PageHeader, PageContainer } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Fragment } from 'react'
import { Plus, Play, Clock, Calendar } from 'lucide-react'
import { cn } from '@/shared/utils'

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

function TasksPage() {
  const {
    activeTasks,
    hasGroups,
    groups,
    selectedTaskId,
    isCreateModalOpen,
    isCreating,
    areGroupsLoading,
    emptyMessage,
    automationSettings,
    isAutomationLoading,
    isAutomationTriggering,
    getTaskDetails,
    handleOpenCreateModal,
    handleCreateTask,
    handleTaskSelect,
    handleCloseTaskDetails,
    handleCloseCreateModal,
    handleOpenAutomationSettings,
    handleAutomationRun,
  } = useTasksViewModel()

  const automationEnabled = automationSettings?.enabled ?? false
  const nextRunText = automationEnabled
    ? formatDateTime(automationSettings?.nextRunAt ?? null)
    : '—'
  const lastRunText = formatDateTime(automationSettings?.lastRunAt ?? null)

  return (
    <PageContainer maxWidth="1600px" animate={false}>
      <PageHeader
        title="Задачи парсинга"
        description="Создавайте задачи на сбор данных из ВКонтакте и отслеживайте прогресс выполнения."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-10 border-accent-primary/20 bg-accent-primary/5 text-accent-primary hover:bg-accent-primary hover:text-text-light hover:border-accent-primary transition-colors duration-200"
              onClick={handleAutomationRun}
              disabled={isAutomationLoading || isAutomationTriggering || automationSettings?.isRunning}
              aria-label="Запустить автоматический сбор данных сейчас"
            >
              {isAutomationTriggering ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2 fill-current" />
              )}
              Запустить сейчас
            </Button>
            <Button
              onClick={handleOpenCreateModal}
              size="lg"
              className="h-10 bg-accent-primary px-6 text-sm font-semibold tracking-wide text-text-light shadow-soft-sm transition-all duration-200 hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreating || areGroupsLoading}
              aria-label="Создать новую задачу парсинга"
            >
              {isCreating ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Создание...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Новая задача</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 md:px-8 pb-3">
        <Badge
          variant="outline"
          className={cn(
            'text-xs tracking-wider font-semibold rounded-full font-mono-accent uppercase',
            automationEnabled
              ? 'border border-accent-success/20 bg-accent-success/10 text-accent-success'
              : 'border border-border/60 bg-background-primary/50 text-text-secondary'
          )}
        >
          {automationEnabled ? 'Автоматизация включена' : 'Автоматизация выключена'}
        </Badge>

        {[
          { icon: Clock, label: 'Следующий запуск:', value: nextRunText },
          { icon: Calendar, label: 'Последний запуск:', value: lastRunText },
        ].map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && <div className="w-px h-3 bg-border/40" />}
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <item.icon className="w-3 h-3" />
              <span className="text-text-secondary/70">{item.label}</span>
              <span className="font-mono-accent text-xs font-medium text-text-primary">{item.value}</span>
            </div>
          </Fragment>
        ))}

        <button
          type="button"
          onClick={handleOpenAutomationSettings}
          className="text-xs font-semibold text-accent-primary hover:text-accent-primary/80 transition-colors"
        >
          Настроить
        </button>
      </div>

      <div className="flex flex-col gap-8">
        <ActiveTasksBanner tasks={activeTasks} isCreating={isCreating} />

        <TasksList
          emptyMessage={emptyMessage}
          onTaskSelect={handleTaskSelect}
          hasGroups={hasGroups}
        />
      </div>

      <TaskDetails task={selectedTaskId != null ? getTaskDetails(selectedTaskId) : undefined} onClose={handleCloseTaskDetails} />

      <CreateParseTaskModal
        isOpen={isCreateModalOpen}
        groups={groups}
        isLoading={isCreating}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateTask}
      />
    </PageContainer>
  )
}

export default TasksPage
