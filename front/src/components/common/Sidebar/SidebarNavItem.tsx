import { NavLink } from 'react-router-dom'
import { getNavItemClasses } from './utils'
import type { SidebarNavItem as SidebarNavItemType } from './types'

interface SidebarNavItemProps {
  item: SidebarNavItemType
}

export function SidebarNavItem({ item }: SidebarNavItemProps) {
  return (
    <NavLink to={item.path} className={({ isActive }) => getNavItemClasses(isActive)}>
      <div className="relative flex flex-1 items-center justify-between animate-in fade-in-0 slide-in-from-left-2 duration-500">
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
          {item.label}
        </span>
        {item.badge && (
          <span className="relative inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/50 px-2 py-0.5 text-[10px] text-cyan-400 backdrop-blur-sm font-mono-accent ml-auto">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500" />
            </span>
            {item.badge}
          </span>
        )}
      </div>
    </NavLink>
  )
}
