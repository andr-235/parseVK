import type { WatchlistAuthorCard, WatchlistComment, WatchlistSettings } from '@/types'
import { formatDateTime as sharedFormatDateTime } from '@/utils/common'

/**
 * Форматирует дату и время в строку в формате ru-RU.
 * @param value - Значение даты в строке или null/undefined
 * @returns Отформатированная строка даты или '—' если значение пустое, или 'Неверная дата' если дата невалидна
 */
export const formatDateTime = (value: string | null | undefined): string => {
  return sharedFormatDateTime(value, {
    emptyValue: '—',
    invalidValue: 'Неверная дата',
  })
}


/**
 * Форматирует статус автора в читаемую строку.
 * @param status - Статус автора
 * @returns Отформатированная строка статуса
 */
export const formatStatus = (status: WatchlistAuthorCard['status']): string => {
  const statusMap: Record<WatchlistAuthorCard['status'], string> = {
    ACTIVE: 'Активен',
    PAUSED: 'Приостановлен',
    STOPPED: 'Отключен',
  }

  return statusMap[status] || 'Неизвестный статус'
}

/**
 * Форматирует источник комментария в читаемую строку.
 * @param comment - Объект комментария
 * @returns Отформатированная строка источника
 */
export const formatCommentSource = (comment: WatchlistComment): string => {
  const sourceMap: Record<string, string> = {
    WATCHLIST: 'Мониторинг',
  }

  return sourceMap[comment.source] || 'Неизвестный источник'
}

/**
 * Извлекает примитивное значение из объекта по ключу.
 * Возвращает значение, если оно является string, number или boolean, иначе null.
 * @param item - Объект для извлечения значения
 * @param key - Ключ свойства
 * @returns Примитивное значение или null
 */
export const getPrimitiveColumnValue = (
  item: unknown,
  key: string
): string | number | boolean | null => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const pathSegments = key.split('.').filter(Boolean)
  let current: unknown = item

  for (const segment of pathSegments) {
    if (!current || typeof current !== 'object') {
      return null
    }

    const record = current as Record<string, unknown>
    current = record[segment]
  }

  if (current == null) {
    return null
  }

  if (typeof current === 'string' || typeof current === 'number' || typeof current === 'boolean') {
    return current
  }

  return null
}

/**
 * Проверяет, что объект settings содержит все необходимые поля с правильными типами
 */
export function isValidWatchlistSettings(settings: unknown): settings is WatchlistSettings {
  return (
    typeof settings === 'object' &&
    settings !== null &&
    typeof (settings as WatchlistSettings).pollIntervalMinutes === 'number' &&
    typeof (settings as WatchlistSettings).maxAuthors === 'number' &&
    typeof (settings as WatchlistSettings).trackAllComments === 'boolean'
  )
}

/**
 * Валидирует ID автора.
 * @param id - ID автора для проверки
 * @returns true, если ID валиден (не undefined), иначе false
 */
export const validateAuthorId = (id: number | undefined): id is number => {
  return id !== undefined
}

/**
 * Фильтрует авторов, исключая тех с undefined id и дубликаты id.
 * @param authors - Массив авторов для фильтрации
 * @returns Отфильтрованный массив валидных авторов без дубликатов
 */
export const filterValidAuthors = (authors: WatchlistAuthorCard[]): WatchlistAuthorCard[] => {
  if (!Array.isArray(authors)) {
    return []
  }
  const seen = new Set<number>()
  return authors.filter((author) => {
    if (!validateAuthorId(author.id) || seen.has(author.id)) return false
    seen.add(author.id)
    return true
  })
}
