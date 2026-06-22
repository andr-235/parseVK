export type Column = {
  key: string
  label: string
  className?: string
  sortable?: boolean
  hide?: string
}

export const STATUS_FILTER_OPTIONS = ['Все статусы', 'Новый', 'Проверка', 'Чисто', 'Нарушение'] as const

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export const STATUS_ACTIONS = [
  { semantic: 'success' as const, label: 'Чисто' },
  { semantic: 'danger' as const, label: 'Нарушение' },
  { semantic: 'warning' as const, label: 'Проверка' },
]
