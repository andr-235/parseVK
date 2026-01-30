import type { ReactNode } from 'react'

export interface SidebarNavItem {
  label: string
  path: string
  badge?: string
}

export interface SidebarNavGroup {
  label: string
  items: SidebarNavItem[]
}

export type SidebarNavEntry = SidebarNavItem | SidebarNavGroup

export interface SidebarItem {
  label: string
  path: string
  icon: ReactNode
  badge?: string
}

export interface SidebarSectionConfig {
  title: string
  icon: ReactNode
  items: SidebarNavEntry[]
  defaultExpanded?: boolean
}

export interface SidebarProps {
  title?: string
}
