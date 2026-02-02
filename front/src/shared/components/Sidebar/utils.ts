import { cn } from '@/shared/utils'

export const getNavItemClasses = (isActive: boolean) => {
  return cn(
    'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 font-monitoring-body',
    isActive
      ? 'text-white font-medium bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 shadow-lg shadow-cyan-500/10'
      : 'text-slate-400 hover:text-white hover:bg-white/5'
  )
}

export const getPrimaryNavItemClasses = (isActive: boolean, isCollapsed: boolean) => {
  return cn(
    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 font-monitoring-body overflow-hidden',
    isActive
      ? 'text-white bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 shadow-xl shadow-cyan-500/20'
      : 'text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:shadow-cyan-500/10',
    isCollapsed && 'justify-center px-0'
  )
}

export const getSectionButtonClasses = (isCollapsed: boolean, isActive: boolean) => {
  return cn(
    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-300 font-monitoring-display',
    isActive
      ? 'text-cyan-400 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20'
      : 'text-slate-300 hover:text-white hover:bg-white/5',
    isCollapsed && 'justify-center px-0'
  )
}

export const getSidebarClasses = (isCollapsed: boolean) => {
  return cn(
    'relative flex min-h-screen shrink-0 flex-col border-r border-white/10 bg-slate-900/80 backdrop-blur-2xl text-slate-200 transition-all duration-300',
    isCollapsed ? 'w-16' : 'w-64'
  )
}
