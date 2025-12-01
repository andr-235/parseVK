import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  useAuthorsStore,
  useCommentsStore,
  useTasksStore,
  useWatchlistStore,
} from '@/stores'
import ThemeToggle from './ThemeToggle'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  MessageSquare,
  Eye,
  Hash,
  Settings,
  Send,
  Building,
  ListTodo,
  LayoutGrid
} from 'lucide-react'

type SidebarItem = {
  label: string
  path: string
  icon: JSX.Element
  badge?: string
}

interface SidebarProps {
  title?: string
}

export function Sidebar({ title = 'Центр аналитики' }: SidebarProps) {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isVkExpanded, setIsVkExpanded] = useState(true)
  const [isParsingExpanded, setIsParsingExpanded] = useState(false)

  const tasksCount = useTasksStore((state) => state.tasks.length)
  const commentsCount = useCommentsStore((state) => state.totalCount)
  const watchlistCount = useWatchlistStore((state) => state.totalAuthors)
  const authorsTotal = useAuthorsStore((state) => state.total)

  const parsingSubItems = useMemo<Array<{ label: string; path: string; badge?: string }>>(() => {
    return [
      { label: 'Недвижимость', path: '/listings' },
    ]
  }, [])

  const primaryItems = useMemo<SidebarItem[]>(() => {
    return [
      { label: 'Telegram', path: '/telegram', icon: <Send className="h-4 w-4" /> },
    ]
  }, [])

  const vkSubItems = useMemo(() => {
    const formatCount = (count: number) => (count > 0 ? String(count) : undefined)
    return [
      { label: 'Задачи', path: '/tasks', badge: formatCount(tasksCount), icon: <ListTodo className="h-4 w-4" /> },
      { label: 'Группы', path: '/groups', icon: <Users className="h-4 w-4" /> },
      { label: 'Комментарии', path: '/comments', badge: formatCount(commentsCount), icon: <MessageSquare className="h-4 w-4" /> },
      { label: 'Авторы', path: '/authors', badge: formatCount(authorsTotal), icon: <Users className="h-4 w-4" /> },
      { label: 'На карандаше', path: '/watchlist', badge: formatCount(watchlistCount), icon: <Eye className="h-4 w-4" /> },
      { label: 'Ключевые слова', path: '/keywords', icon: <Hash className="h-4 w-4" /> },
    ]
  }, [tasksCount, commentsCount, watchlistCount, authorsTotal])

  const secondaryItems: SidebarItem[] = [
    { label: 'Настройки', path: '/settings', icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <aside
      className={cn(
        'sticky top-0 z-30 flex h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div 
          className={cn(
            'flex items-center gap-2 overflow-hidden transition-all', 
            isCollapsed && 'justify-center w-full cursor-pointer hover:opacity-80'
          )}
          onClick={() => isCollapsed && setIsCollapsed(false)}
          title={isCollapsed ? "Развернуть" : undefined}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <LayoutGrid className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold truncate text-sm">{title}</span>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-none">
        <nav className="space-y-6">
          {/* VK Section */}
          <div className="space-y-1">
             {!isCollapsed && (
                <div className="px-2 mb-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                  ВКонтакте
                </div>
             )}
             
             <button
                onClick={() => !isCollapsed && setIsVkExpanded(!isVkExpanded)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  isCollapsed && 'justify-center px-0',
                  // Auto expand active section or highlight if collapsed and active
                  isCollapsed && vkSubItems.some(item => location.pathname.startsWith(item.path)) && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
             >
                {isCollapsed ? (
                     <Users className="h-4 w-4" />
                ) : (
                    <>
                        <div className="flex items-center gap-3 flex-1">
                            <Users className="h-4 w-4" />
                            <span>Основное</span>
                        </div>
                        <ChevronDown
                            className={cn("h-3 w-3 transition-transform", isVkExpanded && "rotate-180")}
                        />
                    </>
                )}
             </button>

            {!isCollapsed && isVkExpanded && (
                <div className="ml-4 space-y-1 mt-1 border-l border-sidebar-border/50 pl-2">
                    {vkSubItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                        cn(
                            'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
                            isActive
                            ? 'text-sidebar-primary font-medium'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
                        )
                        }
                    >
                        <div className="flex flex-1 items-center justify-between">
                            <span>{item.label}</span>
                            {item.badge && (
                            <Badge
                                variant="secondary"
                                className="ml-auto h-5 px-1.5 min-w-5 flex items-center justify-center text-[10px]"
                            >
                                {item.badge}
                            </Badge>
                            )}
                        </div>
                    </NavLink>
                    ))}
                </div>
            )}
          </div>

          {/* Parsing Section */}
          <div className="space-y-1">
            {!isCollapsed && (
                <div className="px-2 mb-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                  Парсинг
                </div>
             )}
             <button
                onClick={() => !isCollapsed && setIsParsingExpanded(!isParsingExpanded)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  isCollapsed && 'justify-center px-0',
                  isCollapsed && parsingSubItems.some(item => location.pathname.startsWith(item.path)) && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
             >
                <Building className="h-4 w-4" />
                {!isCollapsed && (
                    <>
                        <span className="flex-1 text-left">Недвижимость</span>
                         <ChevronDown
                            className={cn("h-3 w-3 transition-transform", isParsingExpanded && "rotate-180")}
                         />
                    </>
                )}
             </button>
             {!isCollapsed && isParsingExpanded && (
                 <div className="ml-4 space-y-1 mt-1 border-l border-sidebar-border/50 pl-2">
                    {parsingSubItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
                                isActive
                                ? 'text-sidebar-primary font-medium'
                                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
                            )
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                 </div>
             )}
          </div>

           {/* Other Primary Items */}
           <div className="space-y-1">
             {primaryItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                     isCollapsed && 'justify-center px-0'
                  )
                }
                 title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
           </div>
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-sidebar-border p-4">
          <div className="space-y-1">
             {secondaryItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                     isCollapsed && 'justify-center px-0'
                  )
                }
                 title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
          
        <div className={cn("mt-4 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
             {!isCollapsed && <ThemeToggle />}
             {isCollapsed && (
                 <button
                    onClick={() => setIsCollapsed(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                 >
                    <ChevronRight className="h-4 w-4" />
                 </button>
             )}
             {!isCollapsed && (
                  <div className="text-xs text-sidebar-foreground/40">v1.0</div>
             )}
        </div>
        {isCollapsed && (
             <div className="mt-2 flex justify-center">
                 <ThemeToggle />
             </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
