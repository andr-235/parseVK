export type Status = 'Чисто' | 'Нарушение' | 'Проверка' | 'Новый'

export const ALL_STATUSES: Status[] = ['Новый', 'Проверка', 'Чисто', 'Нарушение']

export const statusColors: Record<Status, string> = {
  Чисто: 'text-success',
  Нарушение: 'text-danger',
  Проверка: 'text-warning',
  Новый: 'text-warning',
} as const

export type Comment = {
  id: number
  text: string
  group: string
  author: string
  date: string
  status: Status
}

export type UndoEntry = {
  ids: number[]
  from: Status
  to: Status
}
