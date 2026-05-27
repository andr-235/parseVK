import { createElement } from 'react'
import {
  ListTodo,
  Users,
  MessageSquare,
  User,
  Eye,
  Key,
  Download,
  MessageCircle,
  Building,
  Home,
  Send,
  Search,
  DownloadCloud,
} from 'lucide-react'
import type { SidebarItem, SidebarNavItem } from './types'

type SidebarItemConfig = Pick<SidebarItem, 'label' | 'path'>

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
    {
      label: 'Задачи',
      path: '/tasks',
      badge: formatCount(tasksCount),
      icon: createElement(ListTodo, { className: 'h-4 w-4' }),
    },
    {
      label: 'Группы',
      path: '/groups',
      icon: createElement(Users, { className: 'h-4 w-4' }),
    },
    {
      label: 'Комментарии',
      path: '/comments',
      badge: formatCount(commentsCount),
      icon: createElement(MessageSquare, { className: 'h-4 w-4' }),
    },
    {
      label: 'Авторы',
      path: '/authors',
      badge: formatCount(authorsTotal),
      icon: createElement(User, { className: 'h-4 w-4' }),
    },
    {
      label: 'На карандаше',
      path: '/watchlist',
      badge: formatCount(watchlistCount),
      icon: createElement(Eye, { className: 'h-4 w-4' }),
    },
    {
      label: 'Ключевые слова',
      path: '/keywords',
      icon: createElement(Key, { className: 'h-4 w-4' }),
    },
    {
      label: 'Экспорт друзей VK',
      path: '/vk/friends-export',
      icon: createElement(Download, { className: 'h-4 w-4' }),
    },
    {
      label: 'Экспорт друзей OK',
      path: '/ok/friends-export',
      icon: createElement(Download, { className: 'h-4 w-4' }),
    },
  ]
}

export const createMonitoringSubItems = (): SidebarNavItem[] => {
  return [
    {
      label: 'WhatsApp: Сообщения',
      path: '/monitoring/whatsapp',
      icon: createElement(MessageCircle, { className: 'h-4 w-4' }),
    },
    {
      label: 'WhatsApp: Группы',
      path: '/monitoring/whatsapp/groups',
      icon: createElement(Building, { className: 'h-4 w-4' }),
    },
    {
      label: 'Max: Сообщения',
      path: '/monitoring/max',
      icon: createElement(MessageCircle, { className: 'h-4 w-4' }),
    },
    {
      label: 'Max: Группы',
      path: '/monitoring/max/groups',
      icon: createElement(Building, { className: 'h-4 w-4' }),
    },
  ]
}

export const createParsingSubItems = (): SidebarNavItem[] => {
  return [
    {
      label: 'Недвижимость',
      path: '/listings',
      icon: createElement(Home, { className: 'h-4 w-4' }),
    },
  ]
}

export const createTelegramSubItems = (): SidebarNavItem[] => {
  return [
    {
      label: 'Выгрузка пользователей',
      path: '/telegram',
      icon: createElement(Send, { className: 'h-4 w-4' }),
    },
    {
      label: 'Поиск по местным каналам',
      path: '/tgmbase-search',
      icon: createElement(Search, { className: 'h-4 w-4' }),
    },
    {
      label: 'Выгрузка с ДЛ',
      path: '/telegram/dl-upload',
      icon: createElement(DownloadCloud, { className: 'h-4 w-4' }),
    },
  ]
}

export const PRIMARY_ITEMS_CONFIG: readonly SidebarItemConfig[] = []

export const SECONDARY_ITEMS_CONFIG: readonly SidebarItemConfig[] = [
  { label: 'Настройки', path: '/settings' },
]

export const createPrimaryItems = (): SidebarItemConfig[] => {
  return PRIMARY_ITEMS_CONFIG.map((item) => ({
    label: item.label,
    path: item.path,
  }))
}
