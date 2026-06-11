import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, LogOut, Shield, Menu, X, HelpCircle } from 'lucide-react'
import { useTheme } from '../../store/theme'
import { useAuth } from '../../store/auth'
import { useClickOutside } from '../../shared/hooks/useClickOutside'
import { HelpModal } from '../widgets/help/HelpModal'

type HeaderProps = { onToggleSidebar?: () => void }

export function Header({ onToggleSidebar }: HeaderProps) {
  const { theme, toggle } = useTheme()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const ref = useClickOutside(() => setMenuOpen(false))

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((v) => !v)
    onToggleSidebar?.()
  }, [onToggleSidebar])

  const isAdmin = user?.role === 'admin'

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-bg-main px-3 md:px-6">
      <div className="flex items-center gap-3 text-sm text-text-muted">
        <button
          onClick={handleToggleSidebar}
          className="rounded-md p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors duration-150 md:hidden"
          aria-label={sidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <span className="text-text-secondary">Аналитика</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setHelpOpen(true)}
          className="rounded-md p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors duration-150"
          aria-label="Справка по горячим клавишам"
        >
          <HelpCircle size={16} />
        </button>
        <button
          onClick={toggle}
          className="rounded-md p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors duration-150"
          aria-label="Переключить тему"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-bg-hover transition-colors duration-150"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            {user?.username ?? 'Пользователь'}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-md border border-border bg-bg-panel py-1 text-sm" role="menu">
              {isAdmin && (
                <button
                  onClick={() => { navigate('/admin/users'); setMenuOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-text-secondary hover:bg-bg-hover transition-colors duration-150"
                  role="menuitem"
                >
                  <Shield size={14} />
                  Админ-панель
                </button>
              )}
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="rounded-md p-1.5 text-text-muted hover:bg-bg-hover hover:text-danger transition-colors duration-150" aria-label="Выйти">
          <LogOut size={16} />
        </button>
      </div>
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  )
}
