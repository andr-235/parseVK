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

const TelegramIcon = () => (
  <svg
    className={iconClasses}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 11 18-8-4 18-6-4-4 3z" />
    <path d="m10 13 9-9" />
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

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || "h-4 w-4"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export function Sidebar({ title = 'ВК Аналитик' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isVkExpanded, setIsVkExpanded] = useState(false)
  const isDarkMode = useThemeStore((state) => state.isDarkMode)

  const tasksCount = useTasksStore((state) => state.tasks.length)
  const commentsCount = useCommentsStore((state) => state.totalCount)
  const watchlistCount = useWatchlistStore((state) => state.totalAuthors)
  const authorsTotal = useAuthorsStore((state) => state.total)

  const primaryItems = useMemo<SidebarItem[]>(() => {
    return [
      { label: 'Недвижимость', path: '/listings', icon: <ListingsIcon /> },
      { label: 'Telegram', path: '/telegram', icon: <TelegramIcon /> },
    ]
  }, [])

  const vkSubItems = useMemo(() => {
    const formatCount = (count: number) => (count > 0 ? String(count) : undefined)
    return [
      { label: 'Задачи', path: '/tasks', badge: formatCount(tasksCount) },
      { label: 'Группы', path: '/groups' },
      { label: 'Комментарии', path: '/comments', badge: formatCount(commentsCount) },
      { label: 'Авторы', path: '/authors', badge: formatCount(authorsTotal) },
      { label: 'На карандаше', path: '/watchlist', badge: formatCount(watchlistCount) },
      { label: 'Ключевые слова', path: '/keywords' },
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
            <li>
              <button
                onClick={() => !isCollapsed && setIsVkExpanded(!isVkExpanded)}
                className={cn(
                  'group w-full flex items-center justify-between rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isCollapsed && 'justify-center px-2',
                  isDarkMode
                    ? 'hover:border-white/10 hover:bg-white/10 hover:text-white'
                    : 'hover:border-accent-primary/25 hover:bg-accent-primary/10 hover:text-accent-primary',
                  isDarkMode ? 'text-text-light/70' : 'text-text-secondary'
                )}
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
                    <GroupsIcon />
                  </span>
                  {!isCollapsed && <span>ВК</span>}
                </span>
                {!isCollapsed && (
                  <ChevronDownIcon
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isVkExpanded && 'rotate-180'
                    )}
                  />
                )}
              </button>
              {!isCollapsed && isVkExpanded && (
                <ul className="ml-4 mt-1.5 space-y-1">
                  {vkSubItems.map((subItem) => (
                    <li key={subItem.path}>
                      <NavLink
                        to={subItem.path}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center justify-between gap-2 rounded-xl border border-transparent px-3 py-2 text-xs font-medium transition-all duration-200',
                            isDarkMode
                              ? 'hover:border-white/10 hover:bg-white/10 hover:text-white'
                              : 'hover:border-accent-primary/25 hover:bg-accent-primary/10 hover:text-accent-primary',
                            isActive
                              ? isDarkMode
                                ? 'bg-white/15 text-white shadow-soft-sm ring-1 ring-white/15'
                                : 'border-accent-primary/30 bg-accent-primary/15 text-accent-primary shadow-soft-sm ring-1 ring-accent-primary/30'
                              : isDarkMode
                                ? 'text-text-light/60'
                                : 'text-text-secondary/80'
                          )
                        }
                      >
                        <span>{subItem.label}</span>
                        {subItem.badge && (
                          <Badge
                            className={cn(
                              'rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1',
                              isDarkMode ? 'bg-white/15 text-white/90 ring-white/20' : 'bg-accent-primary/15 text-accent-primary ring-accent-primary/30'
                            )}
                          >
                            {subItem.badge}
                          </Badge>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
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
                        isDarkMode
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
