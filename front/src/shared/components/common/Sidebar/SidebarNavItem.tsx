import { NavLink } from 'react-router-dom'
import { getNavItemClasses } from './utils'
import type { SidebarNavItem as SidebarNavItemType } from './types'

interface SidebarNavItemProps {
  item: SidebarNavItemType
  isCollapsed?: boolean
}

export function SidebarNavItem({ item, isCollapsed = false }: SidebarNavItemProps) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) => getNavItemClasses(isActive, isCollapsed)}
      title={isCollapsed ? item.label : undefined}
    >
      <div className="flex items-center gap-3 w-full">
        {item.icon && (
          <span className="flex items-center justify-center shrink-0">{item.icon}</span>
        )}
        {!isCollapsed && (
          <div className="relative flex flex-1 items-center justify-between animate-in fade-in-0 slide-in-from-left-2 duration-300">
            <span className="transition-transform duration-200 group-hover:translate-x-0.5 select-none">
              {item.label}
            </span>
            {item.badge && (
              <span className="relative inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 font-medium font-mono-accent ml-auto select-none">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </div>
    </NavLink>
  )
}
