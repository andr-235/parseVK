export const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(max, Math.max(min, value))
}

export const formatAutomationTime = (hours: number, minutes: number): string => {
  const safeHours = clamp(hours, 0, 23)
  const safeMinutes = clamp(minutes, 0, 59)
  return `${String(safeHours).padStart(2, '0')}:${String(safeMinutes).padStart(2, '0')}`
}

export const formatAutomationDate = (value: string | null, locale = 'ru-RU'): string => {
  if (!value) {
    return '—'
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[automationFormatting] Failed to format date', error)
    }
    return new Date(value).toLocaleString(locale)
  }
}
