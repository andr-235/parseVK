import type { SidebarNavItem } from './types'

export const formatCount = (count: number): string | undefined => {
  return count > 0 ? String(count) : undefined
}

export const createVkSubItems = (
  tasksCount: number,
  commentsCount: number,
  watchlistCount: number,
  authorsTotal: number
): SidebarNavItem[] => {
  return [
    { label: 'Задачи', path: '/tasks', badge: formatCount(tasksCount) },
    { label: 'Группы', path: '/groups' },
    { label: 'Комментарии', path: '/comments', badge: formatCount(commentsCount) },
    { label: 'Авторы', path: '/authors', badge: formatCount(authorsTotal) },
    { label: 'На карандаше', path: '/watchlist', badge: formatCount(watchlistCount) },
    { label: 'Ключевые слова', path: '/keywords' },
  ]
}

export const createParsingSubItems = (): SidebarNavItem[] => {
  return [{ label: 'Недвижимость', path: '/listings' }]
}

export const PRIMARY_ITEMS_CONFIG = [{ label: 'Telegram', path: '/telegram' }] as const

export const SECONDARY_ITEMS_CONFIG = [{ label: 'Настройки', path: '/settings' }] as const
