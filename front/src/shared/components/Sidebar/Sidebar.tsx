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
      {/* Grid Overlay Background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cyan-400/30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <SidebarHeader
          title={title}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          onExpand={handleExpand}
        />

        <div className="flex-1 py-5 px-3 overflow-y-auto">
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
          onExpand={handleExpand}
          footerAction={
            <Button
              variant="ghost"
              size={isCollapsed ? 'icon-sm' : 'sm'}
              onClick={clearAuth}
              className={cn(
                'group relative overflow-hidden transition-all duration-300',
                isCollapsed
                  ? 'h-8 w-8 hover:border-red-400/30 hover:shadow-lg hover:shadow-red-500/20'
                  : 'w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/5'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-pink-500/0 opacity-0 transition-opacity duration-300 group-hover:from-red-500/10 group-hover:to-pink-500/10 group-hover:opacity-100" />
              <LogOut className="relative h-4 w-4" />
              {!isCollapsed && <span className="relative">Выйти</span>}
            </Button>
          }
        />
      </div>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% {
            transform: translateY(-100vh) translateX(50px);
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </aside>
  )
}

export default Sidebar
