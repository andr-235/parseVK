import useTasksViewModel from '@/features/tasks/model/useTasksViewModel'
import TaskDetails from '@/features/tasks/ui/TaskDetails'
import CreateParseTaskModal from '@/features/tasks/ui/CreateParseTaskModal'
import ActiveTasksBanner from '@/features/tasks/ui/ActiveTasksBanner'
import TasksHero from '@/features/tasks/ui/TasksHero'
import TasksList from '@/features/tasks/ui/TasksList'

function Tasks() {
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
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6">
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

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Активные задачи</h2>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <ActiveTasksBanner tasks={activeTasks} isCreating={isCreating} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">История запусков</h2>
          <div className="h-px flex-1 bg-border/60" />
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

export default Tasks
