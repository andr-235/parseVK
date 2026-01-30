import type { BadgeProps } from '@/shared/ui/badge'
import type { ExportJobStatus, JobLogLevel } from '@/services/okFriendsExportService'

export const STATUS_LABELS: Record<ExportJobStatus, string> = {
  PENDING: 'В ожидании',
  RUNNING: 'В работе',
  DONE: 'Готово',
  FAILED: 'Ошибка',
}

export const STATUS_VARIANTS: Record<ExportJobStatus, BadgeProps['variant']> = {
  PENDING: 'outline',
  RUNNING: 'secondary',
  DONE: 'default',
  FAILED: 'destructive',
}

export const LOG_LEVEL_LABELS: Record<JobLogLevel, string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
}

export const LOG_LEVEL_CLASSES: Record<JobLogLevel, string> = {
  info: 'text-text-secondary',
  warn: 'text-accent-warning',
  error: 'text-destructive',
}

export const toOptionalString = (value: string): string | undefined => {
  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }
  return normalized
}

export const toOptionalNumber = (value: string): number | undefined => {
  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  const numeric = Number(normalized)
  if (!Number.isFinite(numeric)) {
    return undefined
  }

  return Math.trunc(numeric)
}

export const formatCellValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет'
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '—'
    }
  }

  return String(value)
}

export const truncateValue = (value: string, limit = 120): string => {
  if (value.length <= limit) {
    return value
  }

  return `${value.slice(0, limit - 3)}...`
}

export const formatLogTime = (value?: string): string => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
