import { useMemo, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { Send, Settings, UserCog, Cpu } from 'lucide-react'
import { useSidebarState } from '@/hooks/common'
import { useSidebarData } from '@/hooks/common'
import { useAuthSession } from '@/hooks/auth/useAuthSession'
import {
  createPrimaryItems,
  createMonitoringSubItems,
  createVkSubItems,
  createParsingSubItems,
  createTelegramSubItems,
  SECONDARY_ITEMS_CONFIG,
} from './constants'
import { getSidebarClasses, getPrimaryNavItemClasses } from './utils'
import { SidebarHeader } from './SidebarHeader'
import { SidebarNavItem } from './SidebarNavItem'
import { SidebarFooter } from './SidebarFooter'
import { SidebarCollapseButton } from './SidebarCollapseButton'
import type { SidebarProps, SidebarItem } from './types'

export function Sidebar({ title = 'Центр аналитики' }: SidebarProps) {
  const { user } = useAuthSession()
  const isAdmin = user?.role === 'admin'

  const {
    isCollapsed,
    toggleCollapse,
    setIsCollapsed,
  } = useSidebarState()

  const { tasksCount, commentsCount, watchlistCount, authorsTotal } = useSidebarData()

  const vkSubItems = useMemo(
    () => createVkSubItems(tasksCount, commentsCount, watchlistCount, authorsTotal),
    [tasksCount, commentsCount, watchlistCount, authorsTotal]
  )

  const monitoringSubItems = createMonitoringSubItems()

  const parsingSubItems = createParsingSubItems()
  const telegramSubItems = createTelegramSubItems()

  const primaryItems = useMemo<SidebarItem[]>(
    () =>
      createPrimaryItems().map((item) => ({
        label: item.label,
        path: item.path,
        icon: <Send className="h-4 w-4" />,
      })),
    []
  )

  const secondaryItems = useMemo<SidebarItem[]>(
    () => [
      {
        label: 'Здоровье системы',
        path: '/metrics',
        icon: <Cpu className="h-4 w-4" />,
      },
      ...(isAdmin
        ? [
            {
              label: 'Пользователи',
              path: '/admin/users',
              icon: <UserCog className="h-4 w-4" />,
            },
          ]
        : []),
      {
        label: SECONDARY_ITEMS_CONFIG[0].label,
        path: SECONDARY_ITEMS_CONFIG[0].path,
        icon: <Settings className="h-4 w-4" />,
      },
    ],
    [isAdmin]
  )

  const handleExpand = useCallback(() => {
    setIsCollapsed(false)
  }, [setIsCollapsed])



  return (
    <aside className={getSidebarClasses(isCollapsed)}>
      <SidebarCollapseButton isCollapsed={isCollapsed} onToggle={toggleCollapse} />
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <SidebarHeader
          title={title}
          isCollapsed={isCollapsed}
          onExpand={handleExpand}
        />

        <div className="flex-1 py-5 px-3 overflow-y-auto no-scrollbar">
          <nav className="space-y-6">
            {/* Группа ВКонтакте */}
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-accent">
                  ВКонтакте
                </div>
              )}
              <div className="space-y-1">
                {vkSubItems.map((item) => (
                  <SidebarNavItem key={item.path} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            </div>

            {/* Группа Мониторинг */}
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-accent">
                  Мониторинг
                </div>
              )}
              <div className="space-y-1">
                {monitoringSubItems.map((item) => (
                  <SidebarNavItem key={item.path} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            </div>

            {/* Группа Парсинг */}
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-accent">
                  Парсинг
                </div>
              )}
              <div className="space-y-1">
                {parsingSubItems.map((item) => (
                  <SidebarNavItem key={item.path} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            </div>

            {/* Группа Telegram */}
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-accent">
                  Telegram
                </div>
              )}
              <div className="space-y-1">
                {telegramSubItems.map((item) => (
                  <SidebarNavItem key={item.path} item={item} isCollapsed={isCollapsed} />
                ))}
              </div>
            </div>

            {primaryItems.length > 0 && (
              <div className="space-y-1 animate-in fade-in-0 slide-in-from-bottom-3 duration-700 delay-300">
                {primaryItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => getPrimaryNavItemClasses(isActive, isCollapsed)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            )}
          </nav>
        </div>

        <SidebarFooter
          items={secondaryItems}
          isCollapsed={isCollapsed}
        />
      </div>


    </aside>
  )
}

export default Sidebar
