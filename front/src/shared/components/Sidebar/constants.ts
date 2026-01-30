import type { SidebarNavEntry } from './types'

export const formatCount = (count: number): string | undefined => {
  return count > 0 ? String(count) : undefined
}

export const createVkSubItems = (
  tasksCount: number,
  commentsCount: number,
  watchlistCount: number,
  authorsTotal: number
): SidebarNavEntry[] => {
  return [
    { label: 'Задачи', path: '/tasks', badge: formatCount(tasksCount) },
    { label: 'Группы', path: '/groups' },
    { label: 'Комментарии', path: '/comments', badge: formatCount(commentsCount) },
    { label: 'Авторы', path: '/authors', badge: formatCount(authorsTotal) },
    { label: 'На карандаше', path: '/watchlist', badge: formatCount(watchlistCount) },
    { label: 'Ключевые слова', path: '/keywords' },
    { label: 'Экспорт друзей VK', path: '/vk/friends-export' },
    { label: 'Экспорт друзей OK', path: '/ok/friends-export' },
  ]
}

export const createMonitoringSubItems = (): SidebarNavEntry[] => {
  return [
    {
      label: 'WhatsApp',
      items: [
        { label: 'Группы', path: '/monitoring/whatsapp/groups' },
        { label: 'Сообщения', path: '/monitoring/whatsapp' },
      ],
    },
    {
      label: 'Max',
      items: [
        { label: 'Группы', path: '/monitoring/max/groups' },
        { label: 'Сообщения', path: '/monitoring/max' },
      ],
    },
  ]
}

export const createParsingSubItems = (): SidebarNavEntry[] => {
  return [{ label: 'Недвижимость', path: '/listings' }]
}

export const PRIMARY_ITEMS_CONFIG = [{ label: 'Telegram', path: '/telegram' }] as const

export const SECONDARY_ITEMS_CONFIG = [{ label: 'Настройки', path: '/settings' }] as const
