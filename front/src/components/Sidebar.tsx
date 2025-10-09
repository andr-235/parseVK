import type { JSX } from 'react'
import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

type SidebarItem = {
  label: string
  path: string
  icon: JSX.Element
  badge?: string
}

type SidebarQuickLink = {
  label: string
  description: string
}

interface SidebarProps {
  title?: string
}

const iconClasses = 'h-5 w-5 shrink-0'

const TasksIcon = () => (
  <svg
    className={iconClasses}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="m9 9 2 2 4-4" />
  </svg>
)

const GroupsIcon = () => (
  <svg
    className={iconClasses}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const CommentsIcon = () => (
  <svg
    className={iconClasses}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
  </svg>
)

const KeywordsIcon = () => (
  <svg
    className={iconClasses}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
)

const ReportsIcon = () => (
  <svg
    className={iconClasses}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10" />
    <path d="M21 15a2 2 0 0 1-2 2h-3l-2 3-2-3H5a2 2 0 0 1-2-2" />
    <path d="M7 10h10" />
    <path d="M7 6h10" />
  </svg>
)

const SettingsIcon = () => (
  <svg
    className={iconClasses}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
)

function Sidebar({ title = 'ВК Аналитик' }: SidebarProps) {
  const primaryItems: SidebarItem[] = [
    { label: 'Задачи', path: '/tasks', icon: <TasksIcon />, badge: '8' },
    { label: 'Группы', path: '/groups', icon: <GroupsIcon /> },
    { label: 'Комментарии', path: '/comments', icon: <CommentsIcon />, badge: '3' },
    { label: 'Ключевые слова', path: '/keywords', icon: <KeywordsIcon /> },
  ]

  const secondaryItems: SidebarItem[] = [
    { label: 'Отчёты', path: '/reports', icon: <ReportsIcon /> },
    { label: 'Настройки', path: '/settings', icon: <SettingsIcon /> },
  ]

  const quickLinks: SidebarQuickLink[] = [
    { label: 'Создать новую задачу', description: 'Запустить мониторинг' },
    { label: 'Импорт из CSV', description: 'Добавить группы списком' },
    { label: 'Подключить аналитику', description: 'Синхронизировать отчёты' },
  ]

  return (
    <aside className="flex h-full w-72 flex-col overflow-hidden rounded-r-3xl bg-gradient-to-b from-background-sidebar via-background-sidebar/95 to-background-sidebar/80 text-text-light shadow-soft-lg transition-colors duration-300">
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

export default Sidebar
