import { useCallback } from 'react'
import { useThemeStore } from '@/store'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

function ThemeToggle({ className }: ThemeToggleProps) {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleTheme()
      }
    },
    [toggleTheme]
  )

  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground/70',
        'transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        className
      )}
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
      aria-label={isDarkMode ? 'Включить светлую тему' : 'Включить тёмную тему'}
      aria-pressed={isDarkMode}
      title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  )
}

export default ThemeToggle
