import { renderHook, act } from '@testing-library/react'
import { useShallow } from 'zustand/react/shallow'
import { useThemeStore } from '../themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useThemeStore.setState({ isDarkMode: false })
  })

  it('should initialize with isDarkMode false', () => {
    const { result } = renderHook(() => useThemeStore((state) => state.isDarkMode))

    expect(result.current).toBe(false)
  })

  it('should toggle theme', () => {
    const { result } = renderHook(() =>
      useThemeStore(
        useShallow((state) => ({
          isDarkMode: state.isDarkMode,
          toggleTheme: state.toggleTheme,
        }))
      )
    )

    expect(result.current.isDarkMode).toBe(false)

    act(() => {
      result.current.toggleTheme()
    })

    const { result: resultAfterToggle } = renderHook(() =>
      useThemeStore((state) => state.isDarkMode)
    )

    expect(resultAfterToggle.current).toBe(true)
  })

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() =>
      useThemeStore(
        useShallow((state) => ({
          isDarkMode: state.isDarkMode,
          toggleTheme: state.toggleTheme,
        }))
      )
    )

    act(() => {
      result.current.toggleTheme()
    })

    const stored = localStorage.getItem('theme-storage')
    expect(stored).toBeTruthy()

    if (stored) {
      const parsed = JSON.parse(stored)
      expect(parsed.state.isDarkMode).toBe(true)
    }
  })

  it('should restore theme from localStorage', () => {
    localStorage.setItem(
      'theme-storage',
      JSON.stringify({ state: { isDarkMode: true }, version: 0 })
    )

    useThemeStore.persist.rehydrate()

    const { result } = renderHook(() => useThemeStore((state) => state.isDarkMode))

    expect(result.current).toBe(true)
  })
})
