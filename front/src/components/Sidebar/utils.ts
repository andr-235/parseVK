import { cn } from '@/lib/utils'

export const getNavItemClasses = (isActive: boolean, isCollapsed: boolean) => {
  return cn(
    'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
    isActive
      ? 'text-sidebar-primary font-medium'
      : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
  )
}

export const getPrimaryNavItemClasses = (isActive: boolean, isCollapsed: boolean) => {
  return cn(
    'group flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
    isCollapsed && 'justify-center px-0'
  )
}

export const getSectionButtonClasses = (
  isCollapsed: boolean,
  isActive: boolean
) => {
  return cn(
    'group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
    isCollapsed && 'justify-center px-0',
    isCollapsed && isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
  )
}

export const getSidebarClasses = (isCollapsed: boolean) => {
  return cn(
    'sticky top-0 z-30 flex h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
    isCollapsed ? 'w-16' : 'w-64'
  )
}

