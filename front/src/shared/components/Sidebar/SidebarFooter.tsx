import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/utils'
import ThemeToggle from '@/shared/components/ThemeToggle'
import { SidebarCollapseButton } from './SidebarCollapseButton'
import { getPrimaryNavItemClasses } from './utils'
import type { SidebarItem } from './types'
import packageJson from '../../../../../../package.json'

interface SidebarFooterProps {
  items: SidebarItem[]
  isCollapsed: boolean
  onExpand: () => void
  footerAction?: ReactNode
}

export function SidebarFooter({ items, isCollapsed, onExpand, footerAction }: SidebarFooterProps) {
  return (
    <div className="border-t border-sidebar-border p-4">
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

      {footerAction && (
        <div className={cn('mt-4 flex', isCollapsed ? 'justify-center' : 'justify-start')}>
          {footerAction}
        </div>
      )}

      <div
        className={cn('mt-4 flex items-center', isCollapsed ? 'justify-center' : 'justify-between')}
      >
        {!isCollapsed && <ThemeToggle />}
        {isCollapsed && <SidebarCollapseButton isCollapsed={isCollapsed} onToggle={onExpand} />}
        {!isCollapsed && (
          <div className="text-xs text-sidebar-foreground/40">v{packageJson.version}</div>
        )}
      </div>
      {isCollapsed && (
        <div className="mt-2 flex justify-center">
          <ThemeToggle />
        </div>
      )}
    </div>
  )
}
