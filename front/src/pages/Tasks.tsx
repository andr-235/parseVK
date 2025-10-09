import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import TaskDetails from '../components/TaskDetails'
import CreateParseTaskModal from '../components/CreateParseTaskModal'
import { useTasksStore, useGroupsStore } from '../stores'
import { getTaskTableColumns } from '../config/taskTableColumns'
import ActiveTasksBanner from '../components/ActiveTasksBanner'
import { isTaskActive } from '../utils/taskProgress'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Separator } from '../components/ui/separator'
import { cn } from '../lib/utils'
import type { Task } from '../types'

type StatusFilter = 'all' | 'active' | 'pending' | 'completed' | 'failed'

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

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
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

  const statusCounts = {
    all: taskMetrics.total,
    active: taskMetrics.active,
    pending: taskMetrics.pending,
    completed: taskMetrics.completed,
    failed: taskMetrics.failed
  }

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') {
      return tasks
    }

    if (statusFilter === 'active') {
      return tasks.filter((task) => task.status === 'processing' || task.status === 'running')
    }

    return tasks.filter((task) => task.status === statusFilter)
  }, [tasks, statusFilter])

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
    : statusFilter === 'all'
      ? 'Нет задач. Создайте новую задачу на парсинг групп.'
      : 'Нет задач с выбранным статусом. Попробуйте выбрать другой фильтр.'

  const createButtonText = isCreating
    ? 'Запуск...'
    : areGroupsLoading
      ? 'Загрузка групп...'
      : groups.length === 0
        ? 'Нет доступных групп'
        : 'Создать задачу на парсинг групп'

  const completionRate = taskMetrics.total > 0
    ? Math.round((taskMetrics.completed / taskMetrics.total) * 100)
    : 0

  const failureRate = taskMetrics.total > 0
    ? Math.round((taskMetrics.failed / taskMetrics.total) * 100)
    : 0

  const statusFilterOptions: Array<{ value: StatusFilter; label: string; count: number; toneClass: string }> = [
    { value: 'all', label: 'Все', count: statusCounts.all, toneClass: 'bg-background-primary/60 text-text-secondary' },
    { value: 'active', label: 'В работе', count: statusCounts.active, toneClass: 'bg-accent-primary/15 text-accent-primary' },
    { value: 'pending', label: 'В ожидании', count: statusCounts.pending, toneClass: 'bg-accent-warning/15 text-accent-warning' },
    { value: 'completed', label: 'Завершены', count: statusCounts.completed, toneClass: 'bg-accent-success/15 text-accent-success' },
    { value: 'failed', label: 'С ошибкой', count: statusCounts.failed, toneClass: 'bg-accent-danger/15 text-accent-danger' }
  ]

  return (
    <div className="flex flex-col gap-8">
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-accent-primary/15 via-background-secondary to-background-secondary/90">
        <div className="pointer-events-none absolute -right-24 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-full bg-accent-primary/20 blur-3xl md:block" />
        <CardHeader className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <CardTitle className="text-3xl font-semibold text-text-primary">Задачи парсинга</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-relaxed">
              Управляйте запуском парсинга, отслеживайте прогресс задач и возвращайтесь к истории запусков, чтобы вовремя реагировать на ошибки.
            </CardDescription>
          </div>

          <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:items-end">
            <Button
              onClick={handleOpenCreateModal}
              disabled={isCreating || areGroupsLoading}
              className="w-full md:w-auto"
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                  {createButtonText}
                </span>
              ) : (
                createButtonText
              )}
            </Button>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              <Badge variant="outline" className="border-accent-primary/40 text-accent-primary">
                Автообновление 8 с
              </Badge>
              <span className="inline-flex items-center gap-2 rounded-full bg-background-primary/70 px-3 py-1 font-semibold uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full bg-accent-primary" aria-hidden />
                Последнее обновление: {formattedLastUpdated}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardFooter className="relative z-10 flex flex-wrap gap-2 pt-0">
          <Badge className="bg-background-primary/60 text-text-secondary">
            Активных задач: {taskMetrics.active}
          </Badge>
          <Badge className="bg-accent-success/15 text-accent-success">
            Завершено: {taskMetrics.completed}
          </Badge>
          <Badge className="bg-accent-danger/15 text-accent-danger">
            С ошибкой: {taskMetrics.failed}
          </Badge>
        </CardFooter>
      </Card>

      <Separator className="opacity-40" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Всего задач
            </CardTitle>
            <div className="text-3xl font-semibold text-text-primary">{taskMetrics.total}</div>
            <CardDescription>Все задачи, созданные для парсинга групп.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border border-accent-primary/40 bg-background-secondary/90">
          <CardHeader className="gap-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
              В работе
            </CardTitle>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-semibold text-accent-primary">{taskMetrics.inProgress}</span>
              <Badge className="bg-accent-warning/15 text-accent-warning">
                В очереди: {taskMetrics.pending}
              </Badge>
            </div>
            <CardDescription>Активные задачи в статусах «Processing» и «Running», включая ожидающие запуска.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border border-accent-success/30 bg-background-secondary/90">
          <CardHeader className="gap-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Завершены
            </CardTitle>
            <span className="text-3xl font-semibold text-accent-success">{taskMetrics.completed}</span>
            <CardDescription>
              Успешность {completionRate}% от общего числа задач.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border border-accent-danger/30 bg-background-secondary/90">
          <CardHeader className="gap-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
              С ошибкой
            </CardTitle>
            <span className="text-3xl font-semibold text-accent-danger">{taskMetrics.failed}</span>
            <CardDescription>
              Неудачные задачи: {failureRate}% от всех запусков.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <ActiveTasksBanner tasks={activeTasks} isCreating={isCreating} />

      <Card className="overflow-hidden border border-border/70 bg-background-secondary shadow-soft-lg">
        <CardHeader className="gap-6 border-b border-border/60 pb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">История запусков</CardTitle>
              <CardDescription>
                Сравнивайте статусы, просматривайте детали и повторно запускайте задачи при необходимости.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-border/60 text-text-secondary">
              Показано: {filteredTasks.length}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilterOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'rounded-full border border-border/60 text-xs font-semibold uppercase tracking-[0.08em]',
                  statusFilter === option.value
                    ? 'bg-accent-primary text-white shadow-soft-sm hover:bg-accent-primary/90'
                    : 'text-text-secondary hover:text-text-primary'
                )}
                onClick={() => setStatusFilter(option.value)}
              >
                <span className="flex items-center gap-2">
                  {option.label}
                  <Badge className={cn('rounded-full px-2.5 py-0', option.toneClass)}>{option.count}</Badge>
                </span>
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="px-2 py-4 sm:px-6">
            {filteredTasks.length === 0 ? (
              <div className="flex min-h-[200px] items-center justify-center text-text-secondary">
                {emptyMessage}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getTaskTableColumns().map((column) => (
                        <TableHead key={column.key} className={column.headerClassName}>
                          {column.header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task, index) => (
                      <TableRow
                        key={task.id}
                        className="cursor-pointer"
                        onClick={() => {
                          void handleTaskSelect(task.id)
                        }}
                      >
                        {getTaskTableColumns().map((column) => (
                          <TableCell key={column.key} className={column.cellClassName}>
                            {column.render ? column.render(task as Task, index) : String(task[column.key as keyof Task] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-3 border-t border-border/60 text-xs text-text-secondary">
          <span>Подсказка: кликните по строке, чтобы открыть детали задачи.</span>
          <span>Фильтры применяются сразу — сбросите их кнопкой «Все».</span>
        </CardFooter>
      </Card>

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
