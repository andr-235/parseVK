import { ApiError } from '../api/client'

export function formatError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'Доступ запрещён'
    if (err.status === 401) return 'Сессия истекла. Войдите заново.'
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Произошла ошибка'
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}
