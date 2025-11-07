import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  useAuthorsStore,
  useCommentsStore,
  useTasksStore,
  useThemeStore,
  useWatchlistStore,
} from '@/stores'
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

const ListingsIcon = () => (
  <svg
    className={iconClasses}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 10.5 9-6.5 9 6.5" />
    <path d="M4 10v10h6v-6h4v6h6V10" />
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

const AuthorsIcon = () => (
  <svg
    className={iconClasses}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
    <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
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

const WatchlistIcon = () => (
  <svg
    className={iconClasses}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0" />
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12" />
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
  const isDarkMode = useThemeStore((state) => state.isDarkMode)

  const tasksCount = useTasksStore((state) => state.tasks.length)
  const commentsCount = useCommentsStore((state) => state.totalCount)
  const watchlistCount = useWatchlistStore((state) => state.totalAuthors)
  const authorsTotal = useAuthorsStore((state) => state.total)

  const primaryItems = useMemo<SidebarItem[]>(() => {
    const formatCount = (count: number) => (count > 0 ? String(count) : undefined)

    return [
      { label: 'Задачи', path: '/tasks', icon: <TasksIcon />, badge: formatCount(tasksCount) },
      { label: 'Группы', path: '/groups', icon: <GroupsIcon /> },
      { label: 'Недвижимость', path: '/listings', icon: <ListingsIcon /> },
      { label: 'Комментарии', path: '/comments', icon: <CommentsIcon />, badge: formatCount(commentsCount) },
      { label: 'Авторы', path: '/authors', icon: <AuthorsIcon />, badge: formatCount(authorsTotal) },
      { label: 'На карандаше', path: '/watchlist', icon: <WatchlistIcon />, badge: formatCount(watchlistCount) },
      { label: 'Ключевые слова', path: '/keywords', icon: <KeywordsIcon /> },
    ]
  }, [tasksCount, commentsCount, watchlistCount, authorsTotal])

  const secondaryItems: SidebarItem[] = [
    { label: 'Настройки', path: '/settings', icon: <SettingsIcon /> },
  ]

  return (
    <aside
      className={cn(
        // Layout
        'sticky top-2 z-10 flex h-[calc(100svh-0.5rem)] shrink-0 flex-col overflow-hidden rounded-r-3xl transition-all duration-300',
        // Visuals
        'bg-gradient-to-b from-background-sidebar via-background-sidebar/95 to-background-sidebar/80 shadow-soft-lg',
        // Widths
        isCollapsed ? 'w-16' : 'w-72',
        // Theme
        isDarkMode ? 'text-text-light' : 'text-text-primary'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          // Sticky header: всегда под рукой при скролле сайдбара
          'sticky top-0 z-20 flex items-start justify-between gap-3 border-b/0 bg-background-sidebar/80 px-4 pb-4 pt-5 backdrop-blur-md supports-[backdrop-filter]:bg-background-sidebar/60',
          isCollapsed && 'items-center px-2 pb-2 pt-2'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3 transition-all',
            isCollapsed ? 'flex-col items-center justify-center gap-2' : ''
          )}
        >
          <img
            src="/favicon-64x64.png"
            alt="ParseVK логотип"
            className={cn('h-10 w-10 shrink-0 rounded-xl object-contain', isCollapsed && 'h-9 w-9')}
          />
          {!isCollapsed && <h2 className="text-xl font-semibold leading-tight">{title}</h2>}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-all duration-200',
                isDarkMode
                  ? 'border-white/10 bg-white/5 text-text-light hover:border-white/20 hover:bg-white/10'
                  : 'border border-border bg-background-secondary text-text-primary hover:border-accent-primary/40 hover:bg-background-secondary/80'
              )}
              aria-label="Expand Sidebar"
              title="Развернуть"
            >
              <ChevronLeftIcon className={cn('h-4 w-4 rotate-180 transition-transform duration-200')} />
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(true)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-all duration-200',
                isDarkMode
                  ? 'border-white/10 bg-white/5 text-text-light hover:border-white/20 hover:bg-white/10'
                  : 'border border-border bg-background-secondary text-text-primary hover:border-accent-primary/40 hover:bg-background-secondary/80'
              )}
              aria-label="Collapse Sidebar"
              title="Свернуть"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <ThemeToggle />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6">
        {/* Primary items */}
        <div>
          {!isCollapsed && (
            <div
              className={cn(
                'mb-3 px-0 text-xs uppercase tracking-[0.35em]',
                isDarkMode ? 'text-text-light/45' : 'text-text-secondary/70'
              )}
            >
              Навигация
            </div>
          )}
          <ul className="space-y-1.5">
            {primaryItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center justify-between rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isCollapsed && 'justify-center px-2',
                      isDarkMode
                        ? 'hover:border-white/10 hover:bg-white/10 hover:text-white'
                        : 'hover:border-accent-primary/25 hover:bg-accent-primary/10 hover:text-accent-primary',
                      isActive
                        ? isDarkMode
                          ? 'bg-white/15 text-white shadow-soft-sm ring-1 ring-white/15 backdrop-blur-md'
                          : 'border-accent-primary/30 bg-accent-primary/15 text-accent-primary shadow-soft-sm ring-1 ring-accent-primary/30'
                        : isDarkMode
                          ? 'text-text-light/70'
                          : 'text-text-secondary'
                    )
                  }
                >
                  <span className={cn('flex items-center', !isCollapsed && 'gap-3')}>
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 ring-1',
                        item.label === 'Задачи'
                          ? 'bg-accent-primary/20 text-accent-primary ring-accent-primary/30'
                          : isDarkMode
                            ? 'bg-white/10 text-text-light/80 ring-white/10 group-hover:text-white'
                            : 'bg-accent-primary/10 text-accent-primary/70 ring-accent-primary/15 group-hover:text-accent-primary'
                      )}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </span>
                  {!isCollapsed && item.badge && (
                    <Badge
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
                        isDarkMode ? 'bg-white/15 text-white/90 ring-white/20' : 'bg-accent-primary/15 text-accent-primary ring-accent-primary/30'
                      )}
                    >
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
            <div
              className={cn(
                'mb-3 px-0 text-xs uppercase tracking-[0.35em]',
                isDarkMode ? 'text-text-light/45' : 'text-text-secondary/70'
              )}
            >
              Управление
            </div>
          )}
          <ul className="space-y-1.5">
            {secondaryItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center justify-between rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isCollapsed && 'justify-center px-2',
                      isDarkMode
                        ? 'hover:border-white/10 hover:bg-white/10 hover:text-white'
                        : 'hover:border-accent-primary/25 hover:bg-accent-primary/10 hover:text-accent-primary',
                      isActive
                        ? isDarkMode
                          ? 'bg-white/15 text-white shadow-soft-sm ring-1 ring-white/15 backdrop-blur-md'
                          : 'border-accent-primary/30 bg-accent-primary/15 text-accent-primary shadow-soft-sm ring-1 ring-accent-primary/30'
                        : isDarkMode
                          ? 'text-text-light/70'
                          : 'text-text-secondary'
                    )
                  }
                >
                  <span className={cn('flex items-center', !isCollapsed && 'gap-3')}>
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 ring-1',
                        isDarkMode
                          ? 'bg-white/10 text-text-light/80 ring-white/10 group-hover:text-white'
                          : 'bg-accent-primary/10 text-accent-primary/70 ring-accent-primary/15 group-hover:text-accent-primary'
                      )}
                    >
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

      {/* Нет нижнего футера — переключатель перенесён наверх */}
    </aside>
  )
}

export default Sidebar
