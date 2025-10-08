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

  const taskMetrics = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        if (task.status === 'completed') {
          acc.completed += 1
        }
        if (task.status === 'failed') {
          acc.failed += 1
        }
        if (task.status === 'pending') {
          acc.pending += 1
        }
        if (task.status === 'processing' || task.status === 'running') {
          acc.inProgress += 1
        }

        return acc
      },
      {
        total: tasks.length,
        active: activeTasks.length,
        completed: 0,
        failed: 0,
        pending: 0,
        inProgress: 0
      }
    )
  }, [tasks, activeTasks])

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
      : groups.length === 0
        ? 'Нет доступных групп'
        : 'Создать задачу на парсинг групп'

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-6 rounded-3xl border border-border bg-background-secondary/80 p-6 shadow-soft-lg transition-colors duration-300 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <PageTitle>Задачи</PageTitle>
          <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
            Управляйте задачами парсинга и отслеживайте их прогресс в режиме реального времени.
          </p>
        </div>

        <div className="flex w-full flex-col items-start gap-3 md:w-auto md:items-end">
          <Button
            onClick={handleOpenCreateModal}
            disabled={isCreating || areGroupsLoading}
            className="w-full md:w-auto"
          >
            {createButtonText}
          </Button>
          <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Последнее обновление: {formattedLastUpdated}
          </span>
        </div>
      </section>

      {(isCreating || hasActiveTasks) && (
        <section>
          <ActiveTasksBanner tasks={activeTasks} isCreating={isCreating} />
        </section>
      )}

      <section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-border bg-background-primary/50 p-5 shadow-soft-sm transition-colors duration-200">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Всего задач</span>
            <span className="mt-3 block text-3xl font-bold text-text-primary">{taskMetrics.total}</span>
            <span className="mt-2 block text-sm text-text-secondary">Все созданные задачи за выбранный период</span>
          </article>
          <article className="rounded-2xl border border-border bg-background-primary/50 p-5 shadow-soft-sm transition-colors duration-200">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">В работе</span>
            <span className="mt-3 block text-3xl font-bold text-accent-info">{taskMetrics.active}</span>
            <span className="mt-2 block text-sm text-text-secondary">Активные и выполняющиеся в настоящий момент задачи</span>
          </article>
          <article className="rounded-2xl border border-border bg-background-primary/50 p-5 shadow-soft-sm transition-colors duration-200">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Ожидают запуска</span>
            <span className="mt-3 block text-3xl font-bold text-accent-warning">{taskMetrics.pending}</span>
            <span className="mt-2 block text-sm text-text-secondary">Задачи в очереди на запуск</span>
          </article>
          <article className="rounded-2xl border border-border bg-background-primary/50 p-5 shadow-soft-sm transition-colors duration-200">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Завершены</span>
            <span className="mt-3 block text-3xl font-bold text-accent-success">{taskMetrics.completed}</span>
            <span className="mt-2 block text-sm text-text-secondary">Успешно выполненные задачи</span>
          </article>
          <article className="rounded-2xl border border-border bg-background-primary/50 p-5 shadow-soft-sm transition-colors duration-200">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">С ошибками</span>
            <span className="mt-3 block text-3xl font-bold text-accent-danger">{taskMetrics.failed}</span>
            <span className="mt-2 block text-sm text-text-secondary">Задачи, завершившиеся с ошибкой</span>
          </article>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-background-secondary shadow-soft-lg">
        <header className="space-y-2 border-b border-border px-6 py-5">
          <h2 className="text-xl font-semibold text-text-primary">История запусков</h2>
          <p className="text-sm text-text-secondary">
            Сравнивайте статусы, просматривайте детали и повторно запускайте задачи при необходимости.
          </p>
        </header>

        <div
          className="px-2 py-4 sm:px-6"
          onClick={(e) => handleRowClick(e, tasks, (id) => {
            void handleTaskSelect(id)
          })}
        >
          <Table
            columns={getTaskTableColumns()}
            data={tasks}
            emptyMessage={emptyMessage}
          />
        </div>
      </section>

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
