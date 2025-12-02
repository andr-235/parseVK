import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          className
        )}
        aria-label="Развернуть"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        className
      )}
      aria-label="Свернуть"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  )
}
