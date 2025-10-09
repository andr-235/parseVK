import { NavLink } from 'react-router-dom'
import {
  CheckSquare,
  Users,
  MessageCircle,
  Key,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

type SidebarItem = {
  label: string
  path: string
  icon: React.ElementType
  badge?: string
}


interface AppSidebarProps {
  title?: string
}

function AppSidebar({ title = 'ВК Аналитик' }: AppSidebarProps) {
  const primaryItems: SidebarItem[] = [
    { label: 'Задачи', path: '/tasks', icon: CheckSquare, badge: '8' },
    { label: 'Группы', path: '/groups', icon: Users },
    { label: 'Комментарии', path: '/comments', icon: MessageCircle, badge: '3' },
    { label: 'Ключевые слова', path: '/keywords', icon: Key },
  ]


  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-b-3xl bg-gradient-to-b from-background-sidebar via-background-sidebar/95 to-background-sidebar/80 text-text-light shadow-soft-lg transition-colors duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:flex-shrink-0 lg:rounded-b-none lg:rounded-r-3xl">
      <div className="flex items-start justify-between gap-3 px-6 pb-6 pt-8">
        <div>
          <span className="text-xs uppercase tracking-[0.35em] text-text-light/50">Панель</span>
          <h2 className="mt-2 text-xl font-semibold leading-tight">{title}</h2>
          <p className="mt-1 text-sm text-text-light/60">Управление сообществами и реакциями в реальном времени</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="mx-6 mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-accent-primary">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 11 3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <div className="flex flex-col text-sm">
          <span className="font-medium text-white">Сводка за день</span>
          <span className="text-text-light/60">12 новых комментариев и 4 задачи на проверке</span>
        </div>
      </div>

      <div className="mx-6 mb-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-text-light/70 shadow-inner backdrop-blur-sm">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" />
        </svg>
        <input
          type="search"
          placeholder="Поиск по проекту"
          className="w-full bg-transparent text-sm text-white placeholder:text-text-light/50 focus:outline-none"
        />
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto px-6 pb-8">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-text-light/45">Навигация</p>
          <ul className="space-y-1.5">
            {primaryItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/15 text-white shadow-soft-sm backdrop-blur-md'
                        : 'text-text-light/70 hover:border-white/10 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 ${
                        item.label === 'Задачи'
                          ? 'bg-accent-primary/20 text-accent-primary'
                          : 'bg-white/10 text-text-light/80 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/90">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-text-light/45">Управление</p>
          <ul className="space-y-1.5">
            {secondaryItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/15 text-white shadow-soft-sm backdrop-blur-md'
                        : 'text-text-light/70 hover:border-white/10 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-text-light/80 transition-colors duration-200 group-hover:text-white">
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-sm shadow-inner backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.35em] text-text-light/45">Быстрые действия</p>
          <ul className="mt-3 space-y-3">
            {quickLinks.map((action) => (
              <li key={action.label} className="group rounded-2xl bg-white/5 px-4 py-3 transition-colors duration-200 hover:bg-white/10">
                <p className="font-medium text-white">{action.label}</p>
                <p className="text-xs text-text-light/60">{action.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="space-y-3 px-6 pb-8">
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-primary/90 px-4 py-3 text-sm font-semibold text-white shadow-soft-md transition hover:bg-accent-primary">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Создать задачу
        </button>
        <p className="text-center text-[11px] text-text-light/50">
          Доступно 2 из 5 проектов. Обновитесь до <span className="font-semibold text-white">Pro</span>, чтобы снимать ограничения.
        </p>
      </div>
    </aside>
  )
}

export default AppSidebar
