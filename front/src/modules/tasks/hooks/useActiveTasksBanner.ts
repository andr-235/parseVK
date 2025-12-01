import { useMemo } from 'react'
import type { Task } from '@/types'
import { calculateTaskProgress } from '@/utils/taskProgress'
import { formatNumber, declOfNumber } from '@/utils/numberFormat'

interface UseActiveTasksBannerResult {
  shouldRender: boolean
  totalActiveTasks: number
  subtitle: string
  aggregatedLabel: string
  indicatorText: string
  progressTotal: number
  processed: number
  aggregatedTone: 'primary' | 'success' | 'danger'
  indeterminate: boolean
}

export const useActiveTasksBanner = (tasks: Task[], isCreating: boolean): UseActiveTasksBannerResult => {
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
  const shouldRender = isCreating || hasActiveTasks

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

  return {
    shouldRender,
    totalActiveTasks,
    subtitle,
    aggregatedLabel,
    indicatorText,
    progressTotal,
    processed: summary.processed,
    aggregatedTone,
    indeterminate: summary.total === 0 && summary.indeterminateCount > 0
  }
}

