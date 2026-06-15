import { create } from 'zustand'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'parsevk-theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
}

interface ThemeStore {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const initial = getInitialTheme()
applyTheme(initial)

export const useTheme = create<ThemeStore>((set) => ({
  theme: initial,
  toggle: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      localStorage.setItem(STORAGE_KEY, next)
      return { theme: next }
    }),
  setTheme: (t) => {
    applyTheme(t)
    localStorage.setItem(STORAGE_KEY, t)
    set({ theme: t })
  },
}))
