import { useMemo } from 'react'
import ProgressBar from './ProgressBar'
import { getTaskStatusText } from '../utils/statusHelpers'
import type { Task } from '../types'
import { calculateTaskProgress } from '../utils/taskProgress'

const STATUS_BADGE_BASE = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide'

const taskStatusClasses: Record<Task['status'], string> = {
  pending: 'bg-accent-warning/20 text-accent-warning',
  processing: 'bg-accent-primary/20 text-accent-primary',
  running: 'bg-accent-primary/20 text-accent-primary',
  completed: 'bg-accent-success/20 text-accent-success',
  failed: 'bg-accent-danger/20 text-accent-danger',
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
    <div className="rounded-3xl border border-border bg-background-secondary/80 p-6 shadow-soft-lg transition-colors duration-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="text-xl font-semibold text-text-primary">Активные процессы парсинга</div>
          <div className="text-sm leading-relaxed text-text-secondary">{subtitle}</div>
        </div>
        {(isCreating || hasActiveTasks) && indicatorText && (
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent-primary">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-primary" aria-hidden />
            <span>{indicatorText}</span>
          </div>
        )}
      </div>

      <ProgressBar
        className="mt-6"
        current={summary.processed}
        total={progressTotal}
        label={aggregatedLabel}
        showLabel
        tone={aggregatedTone}
        indeterminate={summary.total === 0 && summary.indeterminateCount > 0}
      />

      {hasActiveTasks ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
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
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-background-primary/50 p-4 shadow-soft-sm transition-colors duration-200 hover:border-accent-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-text-primary">
                    {task.title ?? `Задача ${task.id}`}
                  </span>
                  <span className={`${STATUS_BADGE_BASE} ${taskStatusClasses[task.status]}`}>
                    {getTaskStatusText(task.status)}
                  </span>
                </div>
                <ProgressBar
                  current={progress.processed}
                  total={taskFallbackTotal}
                  size="small"
                  showLabel
                  label={label}
                  tone={tone}
                  indeterminate={!hasTotals}
                />
                <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                  <span>
                    Обработано: {formatNumber(progress.processed)}
                    {hasTotals ? ` / ${formatNumber(progress.total)}` : ''}
                  </span>
                  {progress.processing > 0 && <span>В работе: {formatNumber(progress.processing)}</span>}
                  {progress.pending > 0 && <span>В очереди: {formatNumber(progress.pending)}</span>}
                  {progress.success > 0 && (
                    <span className="font-semibold text-accent-success">
                      Успешно: {formatNumber(progress.success)}
                    </span>
                  )}
                  {progress.failed > 0 && (
                    <span className="font-semibold text-accent-danger">
                      Ошибок: {formatNumber(progress.failed)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-6 space-y-3 rounded-2xl border border-dashed border-border/70 bg-background-primary/30 p-6 text-center text-sm text-text-secondary">
          <ProgressBar
            current={0}
            total={1}
            showLabel
            label="Подготавливаем задачу..."
            indeterminate
          />
          <p>Мы запускаем задачу. Как только появится прогресс, он отобразится здесь автоматически.</p>
        </div>
      )}
    </div>
  )
}

export default ActiveTasksBanner
