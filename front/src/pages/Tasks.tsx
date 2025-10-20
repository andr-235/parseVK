import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import TaskDetails from '../components/TaskDetails'
import CreateParseTaskModal from '../components/CreateParseTaskModal'
import { useTasksStore, useGroupsStore, useTaskAutomationStore } from '../stores'
import ActiveTasksBanner from '../components/ActiveTasksBanner'
import { isTaskActive } from '../utils/taskProgress'
import { Separator } from '../components/ui/separator'
import TasksHero from './Tasks/components/TasksHero'
import TasksTableCard from './Tasks/components/TasksTableCard'
import { useTasksSocket } from '../hooks/useTasksSocket'

function Tasks() {
  const tasks = useTasksStore((state) => state.tasks)
  const fetchTasks = useTasksStore((state) => state.fetchTasks)
  const createParseTask = useTasksStore((state) => state.createParseTask)
  const fetchTaskDetails = useTasksStore((state) => state.fetchTaskDetails)
  const getTaskDetails = useTasksStore((state) => state.getTaskDetails)
  const isLoading = useTasksStore((state) => state.isLoading)
  const isCreating = useTasksStore((state) => state.isCreating)

  const groups = useGroupsStore((state) => state.groups)
  const fetchGroups = useGroupsStore((state) => state.fetchGroups)
  const areGroupsLoading = useGroupsStore((state) => state.isLoading)

  const automationSettings = useTaskAutomationStore((state) => state.settings)
  const fetchAutomationSettings = useTaskAutomationStore((state) => state.fetchSettings)
  const runAutomation = useTaskAutomationStore((state) => state.runNow)
  const isAutomationLoading = useTaskAutomationStore((state) => state.isLoading)
  const isAutomationTriggering = useTaskAutomationStore((state) => state.isTriggering)

  const [selectedTaskId, setSelectedTaskId] = useState<number | string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const navigate = useNavigate()

  const activeTasks = useMemo(() => tasks.filter(isTaskActive), [tasks])

  const latestTaskDate = useMemo(() => {
    const timestamps = tasks
      .flatMap((task) => [task.completedAt, task.createdAt])
      .map((value) => (value ? Date.parse(value) : Number.NaN))
      .filter((value) => Number.isFinite(value))

    if (timestamps.length === 0) {
      return null
    }

    const latest = Math.max(...timestamps)
    return Number.isFinite(latest) ? new Date(latest) : null
  }, [tasks])

  const formattedLastUpdated = useMemo(() => {
    if (!latestTaskDate) {
      return '—'
    }

    try {
      return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(latestTaskDate)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Tasks] Failed to format date', error)
      }
      return latestTaskDate.toLocaleString('ru-RU')
    }
  }, [latestTaskDate])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    void fetchGroups()
  }, [fetchGroups])

  useEffect(() => {
    void fetchAutomationSettings()
  }, [fetchAutomationSettings])

  useTasksSocket()

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

  const handleCreateTask = async (groupIds: Array<number | string>) => {
    if (groupIds.length === 0) {
      toast.error('Выберите хотя бы одну группу для парсинга')
      return
    }

    const taskId = await createParseTask(groupIds)

    if (taskId != null) {
      setSelectedTaskId(taskId)
      setIsCreateModalOpen(false)
    }
  }

  const handleTaskSelect = async (taskId: number | string) => {
    const loadingToastId = toast.loading('Загружаем детали задачи...')
    const details = await fetchTaskDetails(taskId)
    toast.dismiss(loadingToastId)

    if (details) {
      setSelectedTaskId(taskId)
    }
  }

  const handleOpenAutomationSettings = () => {
    navigate('/settings')
  }

  const handleAutomationRun = async () => {
    await runAutomation()
  }

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
