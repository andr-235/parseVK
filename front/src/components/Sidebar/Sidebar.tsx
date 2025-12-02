import { useMemo, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { Users, Building, Send, Settings } from 'lucide-react'
import { useSidebarState } from '@/hooks/useSidebarState'
import { useSidebarData } from '@/hooks/useSidebarData'
import {
  createVkSubItems,
  createParsingSubItems,
  PRIMARY_ITEMS_CONFIG,
  SECONDARY_ITEMS_CONFIG,
} from './constants'
import { getSidebarClasses, getPrimaryNavItemClasses } from './utils'
import { SidebarHeader } from './SidebarHeader'
import { SidebarSection } from './SidebarSection'
import { SidebarFooter } from './SidebarFooter'
import type { SidebarProps, SidebarItem } from './types'

export function Sidebar({ title = 'Центр аналитики' }: SidebarProps) {
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

  const parsingSubItems = useMemo(() => createParsingSubItems(), [])

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
      {
        label: SECONDARY_ITEMS_CONFIG[0].label,
        path: SECONDARY_ITEMS_CONFIG[0].path,
        icon: <Settings className="h-4 w-4" />,
      },
    ],
    []
  )

  const vkPaths = useMemo(() => vkSubItems.map((item) => item.path), [vkSubItems])
  const parsingPaths = useMemo(() => parsingSubItems.map((item) => item.path), [parsingSubItems])

  const isVkActive = isSectionActive(vkPaths)
  const isParsingActive = isSectionActive(parsingPaths)
  const isVkExpanded = isSectionExpanded('vk')
  const isParsingExpanded = isSectionExpanded('parsing')

  const handleVkToggle = useCallback(() => {
    toggleSection('vk')
  }, [toggleSection])

  const handleParsingToggle = useCallback(() => {
    toggleSection('parsing')
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

      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-none">
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

      <SidebarFooter items={secondaryItems} isCollapsed={isCollapsed} onExpand={handleExpand} />
    </aside>
  )
}

export default Sidebar
