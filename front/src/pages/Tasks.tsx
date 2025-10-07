import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import PageTitle from '../components/PageTitle'
import Button from '../components/Button'
import Table from '../components/Table'
import TaskDetails from '../components/TaskDetails'
import CreateParseTaskModal from '../components/CreateParseTaskModal'
import { useTasksStore, useGroupsStore } from '../stores'
import { handleRowClick } from '../utils/tableHelpers'
import { getTaskTableColumns } from '../config/taskTableColumns'
import ActiveTasksBanner from '../components/ActiveTasksBanner'
import { isTaskActive } from '../utils/taskProgress'

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

  const [selectedTaskId, setSelectedTaskId] = useState<number | string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const activeTasks = useMemo(() => tasks.filter(isTaskActive), [tasks])
  const hasActiveTasks = activeTasks.length > 0

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    void fetchGroups()
  }, [fetchGroups])

  useEffect(() => {
    if (!hasActiveTasks) {
      return
    }

    const intervalId = window.setInterval(() => {
      void fetchTasks()
      if (selectedTaskId != null) {
        void fetchTaskDetails(selectedTaskId)
      }
    }, 8000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [hasActiveTasks, fetchTasks, fetchTaskDetails, selectedTaskId])

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

  const emptyMessage = isLoading
    ? 'Загрузка задач...'
    : 'Нет задач. Создайте новую задачу на парсинг групп.'

  const createButtonText = isCreating
    ? 'Запуск...'
    : areGroupsLoading
      ? 'Загрузка групп...'
      : 'Создать задачу на парсинг групп'

  return (
    <div>
      <PageTitle>Задачи</PageTitle>

      {(isCreating || hasActiveTasks) && (
        <ActiveTasksBanner tasks={activeTasks} isCreating={isCreating} />
      )}

      <div className="keywords-controls">
        <Button onClick={handleOpenCreateModal} disabled={isCreating || areGroupsLoading || groups.length === 0}>
          {createButtonText}
        </Button>
      </div>

      <div onClick={(e) => handleRowClick(e, tasks, (id) => { void handleTaskSelect(id) })}>
        <Table
          columns={getTaskTableColumns()}
          data={tasks}
          emptyMessage={emptyMessage}
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
