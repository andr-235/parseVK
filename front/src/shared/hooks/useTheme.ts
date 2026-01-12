import { useThemeStore } from '@/store'

export function useTheme() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  return { isDarkMode, toggleTheme }
}
