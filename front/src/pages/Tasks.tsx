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
import { Separator } from '../components/ui/separator'
import TasksHero from './Tasks/components/TasksHero'
import TasksTableCard from './Tasks/components/TasksTableCard'

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
    areGroupsLoading
  } = useGroupsStore(
    useShallow((state) => ({
      groups: state.groups,
      fetchGroups: state.fetchGroups,
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

  // Вычисляем дату последнего обновления задачи: берем максимальную дату из completedAt и createdAt всех задач
  const latestTaskDate = useMemo(() => getLatestTaskDate(tasks), [tasks])

  // Форматируем дату последнего обновления в локальный формат с fallback на toLocaleString при ошибке
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

  const handleOpenCreateModal = () => {
    if (areGroupsLoading) {
      return
    }

    if (groups.length === 0) {
      toast.error('Нет групп для парсинга. Добавьте группы на странице "Группы"')
      return
    }

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
    <div className="flex flex-col gap-8">
      <TasksHero
        onCreateTask={handleOpenCreateModal}
        isCreating={isCreating}
        areGroupsLoading={areGroupsLoading}
        hasGroups={groups.length > 0}
        formattedLastUpdated={formattedLastUpdated}
      automation={automationSettings}
        onAutomationRun={handleAutomationRun}
        onOpenAutomationSettings={handleOpenAutomationSettings}
        isAutomationLoading={isAutomationLoading}
        isAutomationTriggering={isAutomationTriggering}
      />

      <Separator className="opacity-40" />

      <ActiveTasksBanner tasks={activeTasks} isCreating={isCreating} />

      <TasksTableCard
        emptyMessage={emptyMessage}
        onTaskSelect={handleTaskSelect}
      />

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
