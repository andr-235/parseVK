import useTasksViewModel from '@/pages/tasks/hooks/useTasksViewModel'
import TaskDetails from '@/pages/tasks/components/TaskDetails'
import CreateParseTaskModal from '@/pages/tasks/components/CreateParseTaskModal'
import ActiveTasksBanner from '@/pages/tasks/components/ActiveTasksBanner'
import TasksList from '@/pages/tasks/components/TasksList'
import { PageHeader, PageContainer } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Play, Settings, Calendar, Clock } from 'lucide-react'
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
    <PageContainer maxWidth="400" animate={false}>
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          colsClass="grid-cols-1 gap-4 md:grid-cols-3"
          title="Задачи парсинга"
          description="Управляйте сбором данных из ВКонтакте. Создавайте новые задачи или настройте автоматический парсинг по расписанию."
          actions={
            <Button
              onClick={handleOpenCreateModal}
              size="lg"
              className="h-10 shrink-0 bg-accent-primary px-6 text-sm font-semibold tracking-wide text-text-light shadow-soft-sm transition-all duration-200 hover:bg-accent-primary/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
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
          }
          cards={[
            {
              icon: Settings,
              title: 'Автоматизация',
              subtitle: '',
              bgGradientClass: 'from-accent-primary/5 to-background-secondary',
              customContent: (
                <div className="flex flex-col justify-between gap-5 h-full w-full">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-monitoring-body text-base font-semibold text-text-primary">
                          Автоматизация
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            'uppercase text-[10px] tracking-wider font-semibold rounded-full font-mono-accent',
                            automationEnabled
                              ? 'border border-accent-success/25 bg-accent-success/10 text-accent-success'
                              : 'border border-border/60 bg-background-primary/50 text-text-secondary'
                          )}
                        >
                          {automationEnabled ? 'Включено' : 'Выключено'}
                        </Badge>
                      </div>
                      <p className="font-monitoring-body text-sm font-normal text-text-secondary">
                        Настройте регулярный сбор данных без вашего участия
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleOpenAutomationSettings}
                      className="hover:bg-background-primary/40 transition-colors"
                      aria-label="Открыть настройки автоматизации"
                    >
                      <Settings className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="p-2 rounded-full bg-accent-info/10 text-accent-info">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary/70">
                          Следующий запуск
                        </span>
                        <span className="font-mono-accent text-xs font-medium text-text-primary">
                          {nextRunText}
                        </span>
                      </div>
                    </div>

                    <div className="w-px h-8 bg-border/60" />

                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="p-2 rounded-full bg-accent-primary/10 text-accent-primary">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary/70">
                          Последний запуск
                        </span>
                        <span className="font-mono-accent text-xs font-medium text-text-primary">
                          {lastRunText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              icon: Play,
              title: 'Запустить сейчас',
              subtitle: '',
              customContent: (
                <div className="flex flex-col items-center justify-center gap-4 text-center h-full w-full min-h-[140px]">
                  <Button
                    variant="outline"
                    className="h-10 w-full text-sm font-semibold border-accent-primary/20 bg-accent-primary/5 text-accent-primary hover:bg-accent-primary hover:text-text-light hover:border-accent-primary transition-all duration-200"
                    onClick={handleAutomationRun}
                    disabled={
                      isAutomationLoading || isAutomationTriggering || automationSettings?.isRunning
                    }
                    aria-label="Запустить автоматический сбор данных сейчас"
                  >
                    {isAutomationTriggering ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2 fill-current" />
                    )}
                    Запустить сейчас
                  </Button>
                  <p className="font-monitoring-body text-xs font-normal text-text-secondary/70 px-4 leading-relaxed">
                    Принудительный запуск парсинга всех активных групп
                  </p>
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <ActiveTasksBanner tasks={activeTasks} isCreating={isCreating} />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <TasksList
          emptyMessage={emptyMessage}
          onTaskSelect={handleTaskSelect}
          hasGroups={hasGroups}
        />
      </div>

      {selectedTaskId && (
        <TaskDetails task={getTaskDetails(selectedTaskId)} onClose={handleCloseTaskDetails} />
      )}

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
