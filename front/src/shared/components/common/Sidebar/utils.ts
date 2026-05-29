import { cn } from '@/shared/utils'

export const getNavItemClasses = (isActive: boolean, isCollapsed: boolean = false) => {
  return cn(
    'group relative flex items-center gap-3 rounded-xl transition-all duration-200 font-monitoring-body select-none',
    isCollapsed ? 'p-2.5 justify-center w-10 h-10 mx-auto' : 'px-3.5 py-2.5 text-sm',
    isActive
      ? 'text-primary font-medium bg-zinc-800/50 shadow-xs'
      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20'
  )
}

export const getPrimaryNavItemClasses = (isActive: boolean, isCollapsed: boolean) => {
  return cn(
    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 font-monitoring-body overflow-hidden',
    isActive
      ? 'text-primary-foreground bg-primary/15 border border-primary/20 shadow-xs'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40',
    isCollapsed && 'justify-center px-0'
  )
}

export const getSectionButtonClasses = (isCollapsed: boolean, isActive: boolean) => {
  return cn(
    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-300 font-monitoring-display',
    isActive
      ? 'text-primary bg-primary/5 border border-primary/10'
      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/30',
    isCollapsed && 'justify-center px-0'
  )
}

export const getSidebarClasses = (isCollapsed: boolean) => {
  return cn(
    'sticky top-0 h-screen flex shrink-0 flex-col border-r border-border bg-sidebar text-slate-200 transition-all duration-300 z-30',
    isCollapsed ? 'w-16' : 'w-64'
  )
}
