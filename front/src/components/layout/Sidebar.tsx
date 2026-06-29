import { useLocation, useNavigate } from 'react-router-dom'
import {
  MessageSquareText,
  Building2,
  ListTodo,
  Users,
  Bookmark,
  Tags,
  Send,
  Upload,
  Search,
  Megaphone,
  UserPlus,
  UserMinus,
  BarChart3,
  Settings,
  Shield,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '../../store/auth'

type NavGroup = {
  label: string
  items: { label: string; path: string; icon: React.ReactNode; soon?: boolean }[]
}

function getGroups(isAdmin: boolean): NavGroup[] {
  const groups: NavGroup[] = [
    {
      label: 'Контент',
      items: [
        { label: 'Комментарии', path: '/comments', icon: <MessageSquareText size={18} /> },
        { label: 'Группы', path: '/groups', icon: <Building2 size={18} /> },
        { label: 'Авторы', path: '/authors', icon: <Users size={18} /> },
        { label: 'На карандаше', path: '/watchlist', icon: <Bookmark size={18} /> },
      ],
    },
    {
      label: 'Парсинг',
      items: [
        { label: 'Задачи', path: '/tasks', icon: <ListTodo size={18} /> },
        { label: 'Ключевые слова', path: '/keywords', icon: <Tags size={18} /> },
      ],
    },
    {
      label: 'Telegram',
      items: [
        { label: 'Выгрузка пользователей', path: '/telegram', icon: <Send size={18} /> },
        { label: 'Выгрузка с ДЛ', path: '/telegram/dl-upload', icon: <Upload size={18} /> },
        { label: 'Поиск по каналам', path: '/tgmbase-search', icon: <Search size={18} /> },
      ],
    },
    {
      label: 'Мониторинг',
      items: [
        { label: 'Мониторинг', path: '/monitoring', icon: <MessageCircle size={18} /> },
      ],
    },
    {
      label: 'Экспорт',
      items: [
        { label: 'Друзья VK', path: '/vk/friends-export', icon: <UserPlus size={18} /> },
        { label: 'Друзья OK', path: '/ok/friends-export', icon: <UserMinus size={18} /> },
      ],
    },
    {
      label: 'Прочее',
      items: [
        { label: 'Объявления', path: '/listings', icon: <Megaphone size={18} />, soon: true },
        { label: 'Метрики', path: '/metrics', icon: <BarChart3 size={18} />, soon: true },
        { label: 'Настройки', path: '/settings', icon: <Settings size={18} />, soon: true },
        ...(isAdmin ? [{ label: 'Админ-панель', path: '/admin/users', icon: <Shield size={18} /> }] : []),
      ],
    },
  ]
  return groups
}

type SidebarProps = { onClose?: () => void }

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const groups = getGroups(user?.role === 'admin')

  const handleNavigate = (path: string) => {
    const [p, q] = path.split('?')
    navigate(q ? { pathname: p, search: `?${q}` } : p)
    onClose?.()
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-bg-sidebar py-4">
      <div className="mb-6 px-4">
        <h2 className="text-lg font-semibold text-text-primary">ParseVK</h2>
        <p className="text-xs text-text-muted">Платформа аналитики</p>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-2">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              {group.label}
            </p>
            {group.items.map((item) => {
              const [itemBase, itemQuery] = item.path.split('?')
              const active = itemQuery
                ? location.pathname === itemBase && location.search === `?${itemQuery}`
                : location.pathname.startsWith(item.path)
              return (
                <button
                  key={item.path}
                  disabled={item.soon}
                  onClick={() => !item.soon && handleNavigate(item.path)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150 ${
                    item.soon
                      ? 'text-text-muted opacity-60 cursor-not-allowed'
                      : active
                      ? 'bg-accent-soft text-accent font-medium'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                  {item.soon && (
                    <span className="ml-auto shrink-0 text-[9px] font-medium tracking-wider uppercase bg-bg-panel border border-border text-text-muted px-1 py-0.5 rounded">
                      Скоро
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

