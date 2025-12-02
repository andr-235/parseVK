/**
 * Утилиты для компонента AuthorAnalysis
 */

/**
 * Форматирует дату и время в читаемый вид
 */
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return 'Нет данных'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Нет данных'
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Метки категорий для отображения
 */
export const categoryLabels: Record<string, string> = {
  violence: 'Насилие',
  drugs: 'Наркотики',
  weapons: 'Оружие',
  nsfw: 'NSFW',
  extremism: 'Экстремизм',
  'hate speech': 'Разжигание ненависти',
}

/**
 * Проверяет, является ли ID автора валидным
 */
export const isValidAuthorId = (vkUserId: number): boolean => {
  return Number.isInteger(vkUserId) && vkUserId > 0
}

/**
 * Вычисляет параметры для анализа фотографий
 */
export const calculateAnalysisParams = (photosCount: number | null, batchSize: number = 10) => {
  const totalPhotos = typeof photosCount === 'number' && photosCount > 0
    ? Math.min(photosCount, 200)
    : 200

  const maxBatches = Math.max(Math.ceil(totalPhotos / batchSize), 1)

  return {
    totalPhotos,
    maxBatches,
    batchSize,
  }
}

