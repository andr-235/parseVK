import type { TgmbaseQueryType, TgmbaseSearchStatus } from '@/shared/types'

export const tgmbaseStatusLabels: Record<TgmbaseSearchStatus, string> = {
  found: 'Найдено',
  not_found: 'Не найдено',
  ambiguous: 'Несколько',
  invalid: 'Невалидно',
  error: 'Ошибка',
}

export const tgmbaseQueryTypeLabels: Record<TgmbaseQueryType, string> = {
  telegramId: 'telegramId',
  username: 'username',
  phoneNumber: 'phone',
  invalid: 'invalid',
}
