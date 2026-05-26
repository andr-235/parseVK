import useTasksViewModel from '@/hooks/tasks/useTasksViewModel'
import TaskDetails from '@/components/tasks/TaskDetails'
import CreateParseTaskModal from '@/components/tasks/CreateParseTaskModal'
import ActiveTasksBanner from '@/components/tasks/ActiveTasksBanner'
import TasksHero from '@/components/tasks/TasksHero'
import TasksList from '@/components/tasks/TasksList'

function TasksPage() {
  const {
    activeTasks,
    hasGroups,
    groups,
    selectedTaskId,
    isCreateModalOpen,
    isCreating,
    areGroupsLoading,
    formattedLastUpdated,
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

  return (
    <div className="flex flex-col gap-10 max-w-400 mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <TasksHero
          onCreateTask={handleOpenCreateModal}
          isCreating={isCreating}
          areGroupsLoading={areGroupsLoading}
          hasGroups={hasGroups}
          formattedLastUpdated={formattedLastUpdated}
          automation={automationSettings}
          onAutomationRun={handleAutomationRun}
          onOpenAutomationSettings={handleOpenAutomationSettings}
          isAutomationLoading={isAutomationLoading}
          isAutomationTriggering={isAutomationTriggering}
        />
      </div>

      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <h2 className="font-monitoring-display text-xl font-semibold text-foreground">
          Активные задачи
        </h2>

        <ActiveTasksBanner tasks={activeTasks} isCreating={isCreating} />
      </div>

      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <h2 className="font-monitoring-display text-xl font-semibold text-foreground">
          История запусков
        </h2>

        <TasksList emptyMessage={emptyMessage} onTaskSelect={handleTaskSelect} />
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
    </div>
  )
}

export default TasksPage
