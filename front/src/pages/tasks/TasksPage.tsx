import useTasksViewModel from '@/pages/tasks/hooks/useTasksViewModel'
import TaskDetails from '@/pages/tasks/components/TaskDetails'
import CreateParseTaskModal from '@/pages/tasks/components/CreateParseTaskModal'
import ActiveTasksBanner from '@/pages/tasks/components/ActiveTasksBanner'
import TasksList from '@/pages/tasks/components/TasksList'
import TaskAutomationStrip from '@/pages/tasks/components/TaskAutomationStrip'
import { PageHeader, PageContainer } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Plus, Play } from 'lucide-react'

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

  return (
    <PageContainer maxWidth="1600px" animate={false}>
      <PageHeader
        title="Р—Р°РґР°С‡Рё РїР°СЂСЃРёРЅРіР°"
        description="РЎРѕР·РґР°РІР°Р№С‚Рµ Р·Р°РґР°С‡Рё РЅР° СЃР±РѕСЂ РґР°РЅРЅС‹С… РёР· Р’РљРѕРЅС‚Р°РєС‚Рµ Рё РѕС‚СЃР»РµР¶РёРІР°Р№С‚Рµ РїСЂРѕРіСЂРµСЃСЃ РІС‹РїРѕР»РЅРµРЅРёСЏ."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-10 border-accent-primary/20 bg-accent-primary/5 text-accent-primary hover:bg-accent-primary hover:text-text-light hover:border-accent-primary transition-colors duration-200"
              onClick={handleAutomationRun}
              disabled={
                isAutomationLoading || isAutomationTriggering || automationSettings?.isRunning
              }
              aria-label="Р—Р°РїСѓСЃС‚РёС‚СЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ СЃР±РѕСЂ РґР°РЅРЅС‹С… СЃРµР№С‡Р°СЃ"
            >
              {isAutomationTriggering ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2 fill-current" />
              )}
              Р—Р°РїСѓСЃС‚РёС‚СЊ СЃРµР№С‡Р°СЃ
            </Button>
            <Button
              onClick={handleOpenCreateModal}
              size="lg"
              className="h-10 bg-accent-primary px-6 text-sm font-semibold tracking-wide text-text-light shadow-soft-sm transition-all duration-200 hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreating || areGroupsLoading}
              aria-label="РЎРѕР·РґР°С‚СЊ РЅРѕРІСѓСЋ Р·Р°РґР°С‡Сѓ РїР°СЂСЃРёРЅРіР°"
            >
              {isCreating ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  <span>РЎРѕР·РґР°РЅРёРµ...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  <span>РќРѕРІР°СЏ Р·Р°РґР°С‡Р°</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      <TaskAutomationStrip
        settings={automationSettings}
        onOpenSettings={handleOpenAutomationSettings}
      />

      <div className="flex flex-col gap-8">
        <ActiveTasksBanner tasks={activeTasks} isCreating={isCreating} />

        <TasksList
          emptyMessage={emptyMessage}
          onTaskSelect={handleTaskSelect}
          hasGroups={hasGroups}
        />
      </div>

      <TaskDetails
        task={selectedTaskId != null ? getTaskDetails(selectedTaskId) : undefined}
        onClose={handleCloseTaskDetails}
      />

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
