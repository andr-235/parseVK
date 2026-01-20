import { NavLink } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { getNavItemClasses } from './utils'
import type { SidebarNavItem as SidebarNavItemType } from './types'

interface SidebarNavItemProps {
  item: SidebarNavItemType
}

export function SidebarNavItem({ item }: SidebarNavItemProps) {
  return (
    <NavLink to={item.path} className={({ isActive }) => getNavItemClasses(isActive)}>
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
  )
}
