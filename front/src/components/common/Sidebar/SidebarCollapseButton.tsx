import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/common'

interface SidebarCollapseButtonProps {
  isCollapsed: boolean
  onToggle: () => void
  className?: string
}

export function SidebarCollapseButton({
  isCollapsed,
  onToggle,
  className,
}: SidebarCollapseButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'absolute -right-3 top-5 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-slate-400 transition-all duration-300 hover:bg-slate-800 hover:text-primary shadow-md hover:scale-105 cursor-pointer',
        className
      )}
      aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}
    >
      {isCollapsed ? (
        <ChevronRight className="h-3.5 w-3.5" />
      ) : (
        <ChevronLeft className="h-3.5 w-3.5" />
      )}
    </button>
  )
}
