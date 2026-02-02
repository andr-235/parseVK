import useTasksViewModel from '@/modules/tasks/hooks/useTasksViewModel'
import TaskDetails from '@/modules/tasks/components/TaskDetails'
import CreateParseTaskModal from '@/modules/tasks/components/CreateParseTaskModal'
import ActiveTasksBanner from '@/modules/tasks/components/ActiveTasksBanner'
import TasksHero from '@/modules/tasks/components/TasksHero'
import TasksList from '@/modules/tasks/components/TasksList'

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
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
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
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Активные задачи
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <ActiveTasksBanner tasks={activeTasks} isCreating={isCreating} />
      </div>

      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            История запусков
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

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
