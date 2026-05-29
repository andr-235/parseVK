import { cn } from '@/shared/utils'
import { BrandLogo } from '@/components/common/BrandLogo'

interface SidebarHeaderProps {
  title: string
  isCollapsed: boolean
  onExpand?: () => void
}

export function SidebarHeader({ title, isCollapsed, onExpand }: SidebarHeaderProps) {
  return (
    <div className="relative flex h-16 items-center px-4 border-b border-border bg-sidebar">
      <div
        className={cn(
          'flex items-center gap-3 overflow-hidden transition-all duration-300',
          isCollapsed && 'justify-center w-full cursor-pointer hover:opacity-80'
        )}
        onClick={isCollapsed ? onExpand : undefined}
        title={isCollapsed ? 'Развернуть' : undefined}
      >
        <BrandLogo size={isCollapsed ? 'sm' : 'md'} className="relative rounded-lg" alt={title} />
        {!isCollapsed && (
          <span className="font-monitoring-display text-sm font-semibold tracking-tight text-white select-none">
            {title.split(' ')[0]} <span className="text-primary">{title.split(' ')[1]}</span>
          </span>
        )}
      </div>
    </div>
  )
}
