import { cn } from '@/shared/utils'
import { BrandLogo } from '@/shared/components/BrandLogo'
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
    <div className="relative flex h-16 items-center justify-between px-4 border-b border-white/10">
      {/* Top Border Glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      <div
        className={cn(
          'flex items-center gap-3 overflow-hidden transition-all duration-300 animate-in fade-in-0 slide-in-from-left-4',
          isCollapsed && 'justify-center w-full cursor-pointer hover:opacity-80'
        )}
        onClick={isCollapsed ? onExpand : undefined}
        title={isCollapsed ? 'Развернуть' : undefined}
      >
        <div className="relative">
          {/* Logo Glow */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <BrandLogo size={isCollapsed ? 'sm' : 'md'} className="relative rounded-lg" alt={title} />
        </div>
        {!isCollapsed && (
          <span className="font-monitoring-display text-sm font-bold tracking-tight text-white">
            {title.split(' ')[0]} <span className="text-cyan-400">{title.split(' ')[1]}</span>
          </span>
        )}
      </div>
      {!isCollapsed && (
        <SidebarCollapseButton isCollapsed={isCollapsed} onToggle={onToggleCollapse} />
      )}
    </div>
  )
}
