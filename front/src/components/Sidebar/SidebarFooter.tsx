import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ThemeToggle'
import { SidebarCollapseButton } from './SidebarCollapseButton'
import { getPrimaryNavItemClasses } from './utils'
import type { SidebarItem } from './types'

interface SidebarFooterProps {
  items: SidebarItem[]
  isCollapsed: boolean
  onExpand: () => void
}

export function SidebarFooter({ items, isCollapsed, onExpand }: SidebarFooterProps) {
  return (
    <div className="mt-auto border-t border-sidebar-border p-4">
      <div className="space-y-1">
        {items.map((item) => (
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

      <div
        className={cn('mt-4 flex items-center', isCollapsed ? 'justify-center' : 'justify-between')}
      >
        {!isCollapsed && <ThemeToggle />}
        {isCollapsed && <SidebarCollapseButton isCollapsed={isCollapsed} onToggle={onExpand} />}
        {!isCollapsed && <div className="text-xs text-sidebar-foreground/40">v1.0</div>}
      </div>
      {isCollapsed && (
        <div className="mt-2 flex justify-center">
          <ThemeToggle />
        </div>
      )}
    </div>
  )
}
