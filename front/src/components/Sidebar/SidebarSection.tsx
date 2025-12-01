import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSectionButtonClasses } from './utils'
import { SidebarNavItem } from './SidebarNavItem'
import type { SidebarNavItem as SidebarNavItemType } from './types'

interface SidebarSectionProps {
  title: string
  icon: React.ReactNode
  items: SidebarNavItemType[]
  isExpanded: boolean
  onToggle: () => void
  isCollapsed: boolean
  isActive: boolean
  collapsedLabel?: string
}

export function SidebarSection({
  title,
  icon,
  items,
  isExpanded,
  onToggle,
  isCollapsed,
  isActive,
  collapsedLabel,
}: SidebarSectionProps) {
  return (
    <div className="space-y-1">
      {!isCollapsed && (
        <div className="px-2 mb-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
          {title}
        </div>
      )}

      <button
        onClick={onToggle}
        className={getSectionButtonClasses(isCollapsed, isActive)}
      >
        {isCollapsed ? (
          icon
        ) : (
          <>
            <div className="flex items-center gap-3 flex-1">
              {icon}
              <span>{collapsedLabel || title}</span>
            </div>
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          </>
        )}
      </button>

      {!isCollapsed && isExpanded && (
        <div className="ml-4 space-y-1 mt-1 border-l border-sidebar-border/50 pl-2">
          {items.map((item) => (
            <SidebarNavItem key={item.path} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

