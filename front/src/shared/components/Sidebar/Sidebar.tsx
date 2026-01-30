import { useMemo, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { Users, Building, Send, Settings, UserCog, LogOut, Activity } from 'lucide-react'
import { useSidebarState } from '@/shared/hooks'
import { useSidebarData } from '@/shared/hooks'
import { useAuthStore } from '@/modules/auth/store'
import { Button } from '@/shared/ui/button'
import {
  createMonitoringSubItems,
  createVkSubItems,
  createParsingSubItems,
  PRIMARY_ITEMS_CONFIG,
  SECONDARY_ITEMS_CONFIG,
} from './constants'
import { getSidebarClasses, getPrimaryNavItemClasses } from './utils'
import { cn } from '@/shared/utils'
import { SidebarHeader } from './SidebarHeader'
import { SidebarSection } from './SidebarSection'
import { SidebarFooter } from './SidebarFooter'
import type { SidebarNavEntry, SidebarProps, SidebarItem } from './types'

const collectNavPaths = (items: SidebarNavEntry[]): string[] => {
  return items.flatMap((item) =>
    'items' in item ? item.items.map((entry) => entry.path) : [item.path]
  )
}

export function Sidebar({ title = 'Центр аналитики' }: SidebarProps) {
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const isAdmin = user?.role === 'admin'

  const {
    isCollapsed,
    toggleCollapse,
    setIsCollapsed,
    isSectionActive,
    isSectionExpanded,
    toggleSection,
  } = useSidebarState()

  const { tasksCount, commentsCount, watchlistCount, authorsTotal } = useSidebarData()

  const vkSubItems = useMemo(
    () => createVkSubItems(tasksCount, commentsCount, watchlistCount, authorsTotal),
    [tasksCount, commentsCount, watchlistCount, authorsTotal]
  )

  const monitoringSubItems = createMonitoringSubItems()

  const parsingSubItems = createParsingSubItems()

  const primaryItems = useMemo<SidebarItem[]>(
    () => [
      {
        label: PRIMARY_ITEMS_CONFIG[0].label,
        path: PRIMARY_ITEMS_CONFIG[0].path,
        icon: <Send className="h-4 w-4" />,
      },
    ],
    []
  )

  const secondaryItems = useMemo<SidebarItem[]>(
    () => [
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

  const vkPaths = useMemo(() => collectNavPaths(vkSubItems), [vkSubItems])
  const monitoringPaths = useMemo(() => collectNavPaths(monitoringSubItems), [monitoringSubItems])
  const parsingPaths = useMemo(() => collectNavPaths(parsingSubItems), [parsingSubItems])

  const isVkActive = isSectionActive(vkPaths)
  const isMonitoringActive = isSectionActive(monitoringPaths)
  const isParsingActive = isSectionActive(parsingPaths)
  const isVkExpanded = isSectionExpanded('vk')
  const isMonitoringExpanded = isSectionExpanded('monitoring')
  const isParsingExpanded = isSectionExpanded('parsing')

  const handleVkToggle = useCallback(() => {
    toggleSection('vk')
  }, [toggleSection])

  const handleParsingToggle = useCallback(() => {
    toggleSection('parsing')
  }, [toggleSection])

  const handleMonitoringToggle = useCallback(() => {
    toggleSection('monitoring')
  }, [toggleSection])

  const handleExpand = useCallback(() => {
    setIsCollapsed(false)
  }, [setIsCollapsed])

  return (
    <aside className={getSidebarClasses(isCollapsed)}>
      <SidebarHeader
        title={title}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        onExpand={handleExpand}
      />

      <div className="py-4 px-3">
        <nav className="space-y-6">
          <SidebarSection
            title="ВКонтакте"
            icon={<Users className="h-4 w-4" />}
            items={vkSubItems}
            isExpanded={isVkExpanded}
            onToggle={handleVkToggle}
            isCollapsed={isCollapsed}
            isActive={isVkActive}
            collapsedLabel="Основное"
          />

          <SidebarSection
            title="Мониторинг"
            icon={<Activity className="h-4 w-4" />}
            items={monitoringSubItems}
            isExpanded={isMonitoringExpanded}
            onToggle={handleMonitoringToggle}
            isCollapsed={isCollapsed}
            isActive={isMonitoringActive}
            collapsedLabel="Мониторинг"
          />

          <SidebarSection
            title="Парсинг"
            icon={<Building className="h-4 w-4" />}
            items={parsingSubItems}
            isExpanded={isParsingExpanded}
            onToggle={handleParsingToggle}
            isCollapsed={isCollapsed}
            isActive={isParsingActive}
            collapsedLabel="Недвижимость"
          />

          {primaryItems.length > 0 && (
            <div className="space-y-1">
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
        onExpand={handleExpand}
        footerAction={
          <Button
            variant="ghost"
            size={isCollapsed ? 'icon-sm' : 'sm'}
            onClick={clearAuth}
            className={cn(isCollapsed ? 'h-8 w-8' : 'w-full justify-start')}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Выйти</span>}
          </Button>
        }
      />
    </aside>
  )
}

export default Sidebar
