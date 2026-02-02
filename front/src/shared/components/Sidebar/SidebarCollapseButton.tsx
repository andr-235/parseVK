import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils'

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
          'group relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-all duration-300 hover:border-cyan-400/30 hover:text-cyan-400 hover:bg-white/5 hover:shadow-lg hover:shadow-cyan-500/20',
          className
        )}
        aria-label="Развернуть"
      >
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 to-blue-500/0 opacity-0 transition-opacity duration-300 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 group-hover:opacity-100" />
        <ChevronRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </button>
    )
  }

  return (
    <button
      onClick={onToggle}
      className={cn(
        'group relative flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-all duration-300 hover:border-cyan-400/30 hover:text-cyan-400 hover:bg-white/5 hover:shadow-lg hover:shadow-cyan-500/20',
        className
      )}
      aria-label="Свернуть"
    >
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 to-blue-500/0 opacity-0 transition-opacity duration-300 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 group-hover:opacity-100" />
      <ChevronLeft className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
    </button>
  )
}
