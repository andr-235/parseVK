import { useLocation, useNavigate } from 'react-router-dom'
import {
  MessageSquareText,
  ListTodo,
  Users,
  Bookmark,
  Tags,
  Send,
  Upload,
  Search,
  Bell,
  Building2,
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
  items: { label: string; path: string; icon: React.ReactNode }[]
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
        { label: 'WhatsApp', path: '/monitoring/whatsapp', icon: <MessageCircle size={18} /> },
        { label: 'Max', path: '/monitoring/max', icon: <Bell size={18} /> },
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
        { label: 'Объявления', path: '/listings', icon: <Building2 size={18} /> },
        { label: 'Метрики', path: '/metrics', icon: <BarChart3 size={18} /> },
        { label: 'Настройки', path: '/settings', icon: <Settings size={18} /> },
        ...(isAdmin ? [{ label: 'Админ-панель', path: '/admin/users', icon: <Shield size={18} /> }] : []),
      ],
    },
  ]
  return groups
}

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const groups = getGroups(user?.role === 'admin')

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-bg-sidebar py-4">
      <div className="mb-6 px-4">
        <h1 className="text-lg font-semibold text-text-primary">ParseVK</h1>
        <p className="text-xs text-text-muted">Watchfloor Console</p>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-2">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = location.pathname.startsWith(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150 ${
                    active
                      ? 'bg-accent-soft text-accent font-medium'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
