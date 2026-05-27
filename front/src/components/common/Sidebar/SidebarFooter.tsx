import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { getPrimaryNavItemClasses } from './utils'
import { useAuthSession } from '@/hooks/auth/useAuthSession'
import type { SidebarItem } from './types'

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0'

interface SidebarFooterProps {
  items: SidebarItem[]
  isCollapsed: boolean
}

export function SidebarFooter({ items, isCollapsed }: SidebarFooterProps) {
  const { user, clearAuth } = useAuthSession()

  const getAvatarChar = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase()
    }
    return 'O'
  }

  return (
    <div className="relative border-t border-border p-4 bg-sidebar">
      {/* Items block */}
      <div className="space-y-1 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => getPrimaryNavItemClasses(isActive, isCollapsed)}
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* Profile Box (Grapho Style) */}
      <div className="mt-4 animate-in fade-in-0 duration-700 delay-100">
        {isCollapsed ? (
          <button
            onClick={clearAuth}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-hover text-text-secondary hover:text-red-400 border border-border cursor-pointer mx-auto transition-all hover:scale-105"
            title="Выйти из системы"
            aria-label="Выйти из системы"
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-card/60 border border-border p-3 select-none">
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm border border-primary/15">
              {getAvatarChar()}
            </div>

            {/* Info */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-text-light truncate">
                {user?.username || 'Оператор'}
              </span>
              <span className="text-[10px] text-text-secondary/70 truncate">
                {user?.username
                  ? `${user.username.toLowerCase()}@parsevk.local`
                  : 'operator@parsevk.local'}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={clearAuth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all shrink-0"
              title="Выйти"
              aria-label="Выйти из системы"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Version Info */}
      {!isCollapsed && (
        <div className="mt-4 flex justify-end text-[9px] text-text-secondary/50 font-mono-accent tracking-wider select-none animate-in fade-in-0 duration-700 delay-200">
          v{APP_VERSION}
        </div>
      )}
    </div>
  )
}
