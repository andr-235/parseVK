import { formatDateTime as sharedFormatDateTime } from '@/utils/common'

/**
 * Утилиты для компонента AuthorAnalysis
 */

/**
 * Форматирует дату и время в читаемый вид
 */
export const formatDateTime = (value: string | null | undefined): string => {
  return sharedFormatDateTime(value, {
    emptyValue: 'Нет данных',
    invalidValue: 'Нет данных',
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
  const totalPhotos =
    typeof photosCount === 'number' && photosCount > 0 ? Math.min(photosCount, 200) : 200

  const maxBatches = Math.max(Math.ceil(totalPhotos / batchSize), 1)

  return {
    totalPhotos,
    maxBatches,
    batchSize,
  }
}
