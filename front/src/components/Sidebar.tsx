import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useCommentsStore, useTasksStore } from '@/stores'
import ThemeToggle from './ThemeToggle'

type SidebarItem = {
  label: string
  path: string
  icon: JSX.Element
  badge?: string
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

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || "h-5 w-5"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export function Sidebar({ title = 'ВК Аналитик' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const tasksCount = useTasksStore((state) => state.tasks.length)
  const commentsCount = useCommentsStore((state) => state.totalCount)

  const primaryItems = useMemo<SidebarItem[]>(() => {
    const formatCount = (count: number) => (count > 0 ? String(count) : undefined)

    return [
      { label: 'Задачи', path: '/tasks', icon: <TasksIcon />, badge: formatCount(tasksCount) },
      { label: 'Группы', path: '/groups', icon: <GroupsIcon /> },
      { label: 'Комментарии', path: '/comments', icon: <CommentsIcon />, badge: formatCount(commentsCount) },
      { label: 'Ключевые слова', path: '/keywords', icon: <KeywordsIcon /> },
    ]
  }, [tasksCount, commentsCount])

  const secondaryItems: SidebarItem[] = [
    { label: 'Отчёты', path: '/reports', icon: <ReportsIcon /> },
    { label: 'Настройки', path: '/settings', icon: <SettingsIcon /> },
  ]

  return (
    <aside
      className={`flex shrink-0 flex-col rounded-r-3xl border-none bg-gradient-to-b from-background-sidebar via-background-sidebar/95 to-background-sidebar/80 text-text-light shadow-soft-lg transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Header */}
      <div className={`flex items-start justify-between gap-3 px-6 pb-6 pt-8 ${isCollapsed ? 'flex-col items-center px-2 pb-2 pt-2' : ''}`}>
        {!isCollapsed && (
          <div>
            <h2 className="text-xl font-semibold leading-tight">{title}</h2>
          </div>
        )}
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-6 px-6">
        {/* Primary items */}
        <div>
          {!isCollapsed && (
            <div className="mb-3 px-0 text-xs uppercase tracking-[0.35em] text-text-light/45">Навигация</div>
          )}
          <ul className="space-y-1.5">
            {primaryItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:border-white/10 hover:bg-white/10 hover:text-white ${
                      isActive ? 'bg-white/15 text-white shadow-soft-sm backdrop-blur-md' : 'text-text-light/70'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`
                  }
                >
                  <span className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 ${
                        item.label === 'Задачи'
                          ? 'bg-accent-primary/20 text-accent-primary'
                          : 'bg-white/10 text-text-light/80 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </span>
                  {!isCollapsed && item.badge && (
                    <Badge className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/90 hover:bg-white/15">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Secondary items */}
        <div>
          {!isCollapsed && (
            <div className="mb-3 px-0 text-xs uppercase tracking-[0.35em] text-text-light/45">Управление</div>
          )}
          <ul className="space-y-1.5">
            {secondaryItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:border-white/10 hover:bg-white/10 hover:text-white ${
                      isActive ? 'bg-white/15 text-white shadow-soft-sm backdrop-blur-md' : 'text-text-light/70'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`
                  }
                >
                  <span className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-text-light/80 transition-colors duration-200 group-hover:text-white">
                      {item.icon}
                    </span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer with Toggle button */}
      <div className={`flex items-center border-t border-white/10 px-6 py-4 ${isCollapsed ? 'justify-center px-2' : 'justify-end'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-light transition-all duration-200 hover:bg-white/10 hover:border-white/20"
          aria-label="Toggle Sidebar"
          title={isCollapsed ? 'Развернуть' : 'Свернуть'}
        >
          <ChevronLeftIcon className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
