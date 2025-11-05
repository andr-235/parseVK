import { useMemo } from 'react'
import ProgressBar from './ProgressBar'
import { getTaskStatusText } from '../utils/statusHelpers'
import type { Task } from '../types'
import { calculateTaskProgress } from '../utils/taskProgress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

const taskStatusClasses: Record<Task['status'], string> = {
  pending: 'bg-accent-warning/15 text-accent-warning',
  processing: 'bg-accent-primary/15 text-accent-primary',
  running: 'bg-accent-primary/15 text-accent-primary',
  completed: 'bg-accent-success/15 text-accent-success',
  failed: 'bg-accent-danger/15 text-accent-danger'
}

interface ActiveTasksBannerProps {
  tasks: Task[]
  isCreating: boolean
}

const numberFormatter = new Intl.NumberFormat('ru-RU')

const formatNumber = (value: number): string => numberFormatter.format(Math.max(0, Math.round(value)))

const declOfNumber = (count: number, titles: [string, string, string]): string => {
  const cases = [2, 0, 1, 1, 1, 2]
  return titles[count % 100 > 4 && count % 100 < 20 ? 2 : cases[Math.min(count % 10, 5)]]
}

function ActiveTasksBanner({ tasks, isCreating }: ActiveTasksBannerProps) {
  const summary = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        const progress = calculateTaskProgress(task)

        acc.total += progress.total
        acc.processed += progress.processed
        acc.success += progress.success
        acc.failed += progress.failed
        acc.processing += progress.processing
        acc.pending += progress.pending
        if (!progress.hasTotals) {
          acc.indeterminateCount += 1
        }

        return acc
      },
      {
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        processing: 0,
        pending: 0,
        indeterminateCount: 0
      }
    )
  }, [tasks])

  const totalActiveTasks = tasks.length
  const hasActiveTasks = totalActiveTasks > 0

  if (!isCreating && !hasActiveTasks) {
    return null
  }

  const fallbackTotal = Math.max(summary.processed + summary.processing + summary.pending, summary.processed, 1)
  const progressTotal = summary.total > 0 ? summary.total : fallbackTotal
  const aggregatedTone = summary.failed > 0
    ? 'danger'
    : summary.total > 0 && summary.processed >= summary.total
      ? 'success'
      : 'primary'

  const summaryParts: string[] = []

  if (summary.processing > 0) {
    summaryParts.push(`В работе: ${formatNumber(summary.processing)}`)
  }

  if (summary.pending > 0) {
    summaryParts.push(`В очереди: ${formatNumber(summary.pending)}`)
  }

  if (summary.failed > 0) {
    summaryParts.push(`Ошибок: ${formatNumber(summary.failed)}`)
  }

  const subtitle = hasActiveTasks
    ? `Отслеживаем ${totalActiveTasks} ${declOfNumber(totalActiveTasks, ['задачу', 'задачи', 'задач'])}. ${
        summaryParts.length > 0
          ? summaryParts.join(' · ')
          : 'Обновляем прогресс автоматически каждые 8 секунд.'
      }`
    : 'Создаем задачу и распределяем группы. Это может занять несколько минут.'

  const aggregatedLabel = summary.total > 0
    ? `Обработано ${formatNumber(summary.processed)} из ${formatNumber(summary.total)}`
    : summary.processing > 0
      ? `В работе: ${formatNumber(summary.processing)}`
      : 'Подготавливаем статистику...'

  const indicatorText = isCreating
    ? 'Запускаем задачу...'
    : hasActiveTasks
      ? 'Обновляем каждые 8 секунд'
      : ''

  return (
    <Card className="border border-accent-primary/30 bg-background-secondary/90">
      <CardHeader className="pb-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">Активные процессы парсинга</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          {(isCreating || hasActiveTasks) && indicatorText && (
            <Badge className="gap-2 bg-accent-primary/15 text-accent-primary">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-primary" aria-hidden />
              {indicatorText}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <ProgressBar
          current={summary.processed}
          total={progressTotal}
          label={aggregatedLabel}
          showLabel
          tone={aggregatedTone}
          indeterminate={summary.total === 0 && summary.indeterminateCount > 0}
        />

        {hasActiveTasks ? (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => {
              const progress = calculateTaskProgress(task)
              const hasTotals = progress.total > 0
              const taskFallbackTotal = hasTotals
                ? progress.total
                : Math.max(progress.processed + progress.processing + progress.pending, progress.processed, 1)

              const label = hasTotals
                ? `Обработано ${formatNumber(progress.processed)} из ${formatNumber(progress.total)}`
                : progress.processing > 0
                  ? `В работе: ${formatNumber(progress.processing)}`
                  : 'Ожидаем запуск обработки...'

              const tone = progress.failed > 0
                ? 'danger'
                : task.status === 'completed'
                  ? 'success'
                  : 'primary'

              return (
                <Card
                  key={task.id}
                  className="border border-border/60 bg-background-primary/60 shadow-soft-sm"
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                    <CardTitle className="text-sm font-semibold leading-tight">
                      {task.title ?? `Задача ${task.id}`}
                    </CardTitle>
                    <Badge className={taskStatusClasses[task.status]}>
                      {getTaskStatusText(task.status)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ProgressBar
                      current={progress.processed}
                      total={taskFallbackTotal}
                      size="small"
                      showLabel
                      label={label}
                      tone={tone}
                      indeterminate={!hasTotals}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-dashed border-border/70 bg-background-primary/40 p-6 text-center text-sm text-text-secondary">
            <ProgressBar current={0} total={1} showLabel label="Подготавливаем задачу..." indeterminate />
            <p>Мы запускаем задачу. Как только появится прогресс, он отобразится здесь автоматически.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ActiveTasksBanner
