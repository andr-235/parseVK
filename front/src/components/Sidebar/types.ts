import type { ReactNode } from 'react'

export interface SidebarNavItem {
  label: string
  path: string
  badge?: string
}

export interface SidebarItem {
  label: string
  path: string
  icon: ReactNode
  badge?: string
}

export interface SidebarSectionConfig {
  title: string
  icon: ReactNode
  items: SidebarNavItem[]
  defaultExpanded?: boolean
}

export interface SidebarProps {
  title?: string
}

