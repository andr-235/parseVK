import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../useTheme'
import { useThemeStore } from '@/store/themeStore'

// Мокаем store
jest.mock('@/store/themeStore', () => ({
  useThemeStore: jest.fn(),
}))

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return isDarkMode and toggleTheme', () => {
    const mockToggleTheme = jest.fn()
    ;(useThemeStore as jest.Mock).mockImplementation((selector) => {
      const state = {
        isDarkMode: false,
        toggleTheme: mockToggleTheme,
      }
      return selector(state)
    })

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDarkMode).toBe(false)
    expect(result.current.toggleTheme).toBe(mockToggleTheme)
  })

  it('should return dark mode when enabled', () => {
    ;(useThemeStore as jest.Mock).mockImplementation((selector) => {
      const state = {
        isDarkMode: true,
        toggleTheme: jest.fn(),
      }
      return selector(state)
    })

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDarkMode).toBe(true)
  })

  it('should call toggleTheme when called', () => {
    const mockToggleTheme = jest.fn()
    ;(useThemeStore as jest.Mock).mockImplementation((selector) => {
      const state = {
        isDarkMode: false,
        toggleTheme: mockToggleTheme,
      }
      return selector(state)
    })

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(mockToggleTheme).toHaveBeenCalledTimes(1)
  })
})
