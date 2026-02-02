import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/utils'
import { SidebarCollapseButton } from './SidebarCollapseButton'
import { getPrimaryNavItemClasses } from './utils'
import type { SidebarItem } from './types'

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0'

interface SidebarFooterProps {
  items: SidebarItem[]
  isCollapsed: boolean
  onExpand: () => void
  footerAction?: ReactNode
}

export function SidebarFooter({ items, isCollapsed, onExpand, footerAction }: SidebarFooterProps) {
  return (
    <div className="relative border-t border-white/10 p-4">
      {/* Top Accent Line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

      <div className="space-y-1 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
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
        <div
          className={cn(
            'mt-4 flex animate-in fade-in-0 duration-700 delay-100',
            isCollapsed ? 'justify-center' : 'justify-start'
          )}
        >
          {footerAction}
        </div>
      )}

      <div
        className={cn(
          'mt-4 flex items-center animate-in fade-in-0 duration-700 delay-200',
          isCollapsed ? 'justify-center' : 'justify-end'
        )}
      >
        {isCollapsed && <SidebarCollapseButton isCollapsed={isCollapsed} onToggle={onExpand} />}
        {!isCollapsed && (
          <div className="text-[10px] text-slate-500 font-mono-accent tracking-wider">
            v{APP_VERSION}
          </div>
        )}
      </div>
    </div>
  )
}
