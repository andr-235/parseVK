import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import toast from 'react-hot-toast'
import TaskDetails from '../components/TaskDetails'
import CreateParseTaskModal from '../components/CreateParseTaskModal'
import { useTasksStore, useGroupsStore, useTaskAutomationStore } from '../stores'
import ActiveTasksBanner from '../components/ActiveTasksBanner'
import { isTaskActive } from '@/utils/taskProgress'
import { getLatestTaskDate, formatTaskDate } from '@/utils/taskDates'
import TasksHero from './Tasks/components/TasksHero'
import TasksList from './Tasks/components/TasksList'

const Tasks = () => {
  const {
    tasks,
    fetchTasks,
    createParseTask,
    fetchTaskDetails,
    getTaskDetails,
    isLoading,
    isCreating
  } = useTasksStore(
    useShallow((state) => ({
      tasks: state.tasks,
      fetchTasks: state.fetchTasks,
      createParseTask: state.createParseTask,
      fetchTaskDetails: state.fetchTaskDetails,
      getTaskDetails: state.getTaskDetails,
      isLoading: state.isLoading,
      isCreating: state.isCreating
    }))
  )

  const {
    groups,
    fetchGroups,
    fetchAllGroups,
    areGroupsLoading
  } = useGroupsStore(
    useShallow((state) => ({
      groups: state.groups,
      fetchGroups: state.fetchGroups,
      fetchAllGroups: state.fetchAllGroups,
      areGroupsLoading: state.isLoading
    }))
  )

  const {
    settings: automationSettings,
    fetchSettings: fetchAutomationSettings,
    runNow: runAutomation,
    isLoading: isAutomationLoading,
    isTriggering: isAutomationTriggering
  } = useTaskAutomationStore(
    useShallow((state) => ({
      settings: state.settings,
      fetchSettings: state.fetchSettings,
      runNow: state.runNow,
      isLoading: state.isLoading,
      isTriggering: state.isTriggering
    }))
  )

  const [selectedTaskId, setSelectedTaskId] = useState<number | string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const navigate = useNavigate()

  const activeTasks = useMemo(() => tasks.filter(isTaskActive), [tasks])
  const hasGroups = Array.isArray(groups) && groups.length > 0

  // Вычисляем дату последнего обновления задачи
  const latestTaskDate = useMemo(() => getLatestTaskDate(tasks), [tasks])

  // Форматируем дату последнего обновления
  const formattedLastUpdated = useMemo(
    () => formatTaskDate(latestTaskDate, 'ru-RU'),
    [latestTaskDate]
  )

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    void fetchGroups()
  }, [fetchGroups])

  useEffect(() => {
    void fetchAutomationSettings()
  }, [fetchAutomationSettings])

  useEffect(() => {
    if (selectedTaskId == null) {
      return
    }

    const exists = tasks.some((task) => String(task.id) === String(selectedTaskId))

    if (!exists) {
      setSelectedTaskId(null)
    }
  }, [tasks, selectedTaskId])

  const handleOpenCreateModal = async () => {
    if (areGroupsLoading) {
      return
    }

    if (!hasGroups) {
      toast.error('Нет групп для парсинга. Добавьте группы на странице "Группы"')
      return
    }

    await fetchAllGroups()
    setIsCreateModalOpen(true)
  }

  const handleCreateTask = useCallback(async (groupIds: Array<number | string>) => {
    if (groupIds.length === 0) {
      toast.error('Выберите хотя бы одну группу для парсинга')
      return
    }

    try {
      const taskId = await createParseTask(groupIds)

      if (taskId != null) {
        setSelectedTaskId(taskId)
        setIsCreateModalOpen(false)
      }
    } catch (error) {
      toast.error('Ошибка при создании задачи')
      console.error('Failed to create task:', error)
    }
  }, [createParseTask])

  const handleTaskSelect = useCallback(async (taskId: number | string) => {
    const loadingToastId = toast.loading('Загружаем детали задачи...')

    try {
      const details = await fetchTaskDetails(taskId)
      toast.dismiss(loadingToastId)

      if (details) {
        setSelectedTaskId(taskId)
      }
    } catch (error) {
      toast.dismiss(loadingToastId)
      toast.error('Ошибка при загрузке деталей задачи')
      console.error('Failed to fetch task details:', error)
    }
  }, [fetchTaskDetails])

  const handleOpenAutomationSettings = () => {
    navigate('/settings')
  }

  const handleAutomationRun = useCallback(async () => {
    try {
      await runAutomation()
    } catch (error) {
      toast.error('Ошибка при запуске автоматизации')
      console.error('Failed to run automation:', error)
    }
  }, [runAutomation])

  const emptyMessage = isLoading
    ? 'Загрузка задач...'
    : 'Нет задач. Создайте новую задачу на парсинг групп.'

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

        <TasksList
          emptyMessage={emptyMessage}
          onTaskSelect={handleTaskSelect}
        />
      </div>

      {selectedTaskId && (
        <TaskDetails
          task={getTaskDetails(selectedTaskId)}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      <CreateParseTaskModal
        isOpen={isCreateModalOpen}
        groups={groups}
        isLoading={isCreating}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  )
}

export default Tasks
