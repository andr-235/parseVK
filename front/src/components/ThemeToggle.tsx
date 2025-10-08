import { useThemeStore } from '../stores'

function ThemeToggle() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xl transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background-sidebar focus-visible:ring-accent-primary"
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Включить светлую тему' : 'Включить тёмную тему'}
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  )
}

export default ThemeToggle
