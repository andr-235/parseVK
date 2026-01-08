import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/BrandLogo'
import { SidebarCollapseButton } from './SidebarCollapseButton'

interface SidebarHeaderProps {
  title: string
  isCollapsed: boolean
  onToggleCollapse: () => void
  onExpand?: () => void
}

export function SidebarHeader({
  title,
  isCollapsed,
  onToggleCollapse,
  onExpand,
}: SidebarHeaderProps) {
  return (
    <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
      <div
        className={cn(
          'flex items-center gap-2 overflow-hidden transition-all',
          isCollapsed && 'justify-center w-full cursor-pointer hover:opacity-80'
        )}
        onClick={isCollapsed ? onExpand : undefined}
        title={isCollapsed ? 'Развернуть' : undefined}
      >
        <BrandLogo size={isCollapsed ? 'sm' : 'md'} className="rounded-lg" alt={title} />
        {!isCollapsed && <span className="font-semibold truncate text-sm">{title}</span>}
      </div>
      {!isCollapsed && (
        <SidebarCollapseButton isCollapsed={isCollapsed} onToggle={onToggleCollapse} />
      )}
    </div>
  )
}
