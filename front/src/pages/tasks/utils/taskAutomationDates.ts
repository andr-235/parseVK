const EMPTY_DATE = 'вЂ”'

export function formatTaskAutomationDate(value: string | null): string {
  if (!value) return EMPTY_DATE
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return EMPTY_DATE
  }
}

export { EMPTY_DATE as TASK_AUTOMATION_EMPTY_DATE }
