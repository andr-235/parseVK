import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import toast from 'react-hot-toast'
import { useTasksStore, useGroupsStore, useTaskAutomationStore } from '@/store'
import { useTasksQuery } from '@/modules/tasks/hooks/useTasksQuery'
import { useTasksSocket } from '@/modules/tasks/hooks/useTasksSocket'
import { isTaskActive } from '@/utils/taskProgress'
import { getLatestTaskDate, formatTaskDate } from '@/modules/tasks/utils/taskDates'

export const useTasksViewModel = () => {
  const navigate = useNavigate()

  const {
    tasks,
    fetchTasks,
    createParseTask,
    fetchTaskDetails,
    getTaskDetails,
    isLoading,
    isCreating,
  } = useTasksStore(
    useShallow((state) => ({
      tasks: state.tasks,
      fetchTasks: state.fetchTasks,
      createParseTask: state.createParseTask,
      fetchTaskDetails: state.fetchTaskDetails,
      getTaskDetails: state.getTaskDetails,
      isLoading: state.isLoading,
      isCreating: state.isCreating,
    }))
  )

  const {
    groups,
    fetchGroups,
    fetchAllGroups,
    areGroupsLoading,
  } = useGroupsStore(
    useShallow((state) => ({
      groups: state.groups,
      fetchGroups: state.fetchGroups,
      fetchAllGroups: state.fetchAllGroups,
      areGroupsLoading: state.isLoading,
    }))
  )

  const {
    settings: automationSettings,
    fetchSettings: fetchAutomationSettings,
    runNow: runAutomation,
    isLoading: isAutomationLoading,
    isTriggering: isAutomationTriggering,
  } = useTaskAutomationStore(
    useShallow((state) => ({
      settings: state.settings,
      fetchSettings: state.fetchSettings,
      runNow: state.runNow,
      isLoading: state.isLoading,
      isTriggering: state.isTriggering,
    }))
  )

  const [selectedTaskId, setSelectedTaskId] = useState<number | string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useTasksQuery()
  useTasksSocket()

  const activeTasks = useMemo(() => tasks.filter(isTaskActive), [tasks])
  const hasGroups = Array.isArray(groups) && groups.length > 0

  const latestTaskDate = useMemo(() => getLatestTaskDate(tasks), [tasks])

  const formattedLastUpdated = useMemo(
    () => formatTaskDate(latestTaskDate, 'ru-RU'),
    [latestTaskDate]
  )

  const emptyMessage = useMemo(
    () =>
      isLoading
        ? 'Загрузка задач...'
        : 'Нет задач. Создайте новую задачу на парсинг групп.',
    [isLoading]
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

  const handleOpenCreateModal = useCallback(async () => {
    if (areGroupsLoading) {
      return
    }

    if (!hasGroups) {
      toast.error('Нет групп для парсинга. Добавьте группы на странице "Группы"')
      return
    }

    await fetchAllGroups()
    setIsCreateModalOpen(true)
  }, [areGroupsLoading, hasGroups, fetchAllGroups])

  const handleCreateTask = useCallback(
    async (groupIds: Array<number | string>) => {
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
    },
    [createParseTask]
  )

  const handleTaskSelect = useCallback(
    async (taskId: number | string) => {
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
    },
    [fetchTaskDetails]
  )

  const handleCloseTaskDetails = useCallback(() => {
    setSelectedTaskId(null)
  }, [])

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false)
  }, [])

  const handleOpenAutomationSettings = useCallback(() => {
    navigate('/settings')
  }, [navigate])

  const handleAutomationRun = useCallback(async () => {
    try {
      await runAutomation()
    } catch (error) {
      toast.error('Ошибка при запуске автоматизации')
      console.error('Failed to run automation:', error)
    }
  }, [runAutomation])

  return {
    tasks,
    activeTasks,
    hasGroups,
    groups,
    selectedTaskId,
    isCreateModalOpen,
    isLoading,
    isCreating,
    areGroupsLoading,
    latestTaskDate,
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
  }
}

export default useTasksViewModel
