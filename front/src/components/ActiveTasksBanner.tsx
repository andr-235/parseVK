import { useMemo } from 'react'
import ProgressBar from './ProgressBar'
import { getTaskStatusText } from '../utils/statusHelpers'
import type { Task } from '../types'
import { calculateTaskProgress } from '../utils/taskProgress'

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
    <div className="active-tasks-banner">
      <div className="active-tasks-banner__header">
        <div className="active-tasks-banner__summary">
          <div className="active-tasks-banner__title">Активные процессы парсинга</div>
          <div className="active-tasks-banner__subtitle">{subtitle}</div>
        </div>
        {(isCreating || hasActiveTasks) && indicatorText && (
          <div className="active-tasks-banner__indicator">
            <span className="active-tasks-banner__pulse-dot" />
            <span>{indicatorText}</span>
          </div>
        )}
      </div>

      <ProgressBar
        current={summary.processed}
        total={progressTotal}
        label={aggregatedLabel}
        showLabel
        tone={aggregatedTone}
        indeterminate={summary.total === 0 && summary.indeterminateCount > 0}
      />

      {hasActiveTasks ? (
        <div className="active-tasks-banner__tasks">
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
              <div key={task.id} className="active-tasks-banner__task">
                <div className="active-tasks-banner__task-header">
                  <span className="active-tasks-banner__task-title">{task.title ?? `Задача ${task.id}`}</span>
                  <span className={`status-badge status-${task.status}`}>
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
                <div className="active-tasks-banner__task-meta">
                  <span>
                    Обработано: {formatNumber(progress.processed)}
                    {hasTotals ? ` / ${formatNumber(progress.total)}` : ''}
                  </span>
                  {progress.processing > 0 && <span>В работе: {formatNumber(progress.processing)}</span>}
                  {progress.pending > 0 && <span>В очереди: {formatNumber(progress.pending)}</span>}
                  {progress.success > 0 && <span className="success-text">Успешно: {formatNumber(progress.success)}</span>}
                  {progress.failed > 0 && <span className="error-text">Ошибок: {formatNumber(progress.failed)}</span>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="active-tasks-banner__empty">
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
