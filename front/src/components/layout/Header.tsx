import { Moon, Sun, LogOut } from 'lucide-react'
import { useTheme } from '../../store/theme'

export function Header() {
  const { theme, toggle } = useTheme()

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-bg-main px-6">
      <div className="flex items-center gap-3 text-sm text-text-muted">
        <span className="text-text-secondary">Аналитика</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="rounded-md p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors duration-150"
          aria-label="Переключить тему"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <span className="text-sm text-text-secondary">admin</span>
        <button className="rounded-md p-1.5 text-text-muted hover:bg-bg-hover hover:text-danger transition-colors duration-150">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
