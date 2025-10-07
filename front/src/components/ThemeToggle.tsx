import { useThemeStore } from '../stores'

function ThemeToggle() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  )
}

export default ThemeToggle
