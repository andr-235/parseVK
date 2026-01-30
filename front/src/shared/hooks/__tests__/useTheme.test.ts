import { vi } from 'vitest'

vi.mock('@/shared/api', () => ({
  API_URL: '/api',
}))

vi.mock('@/shared/store', () => ({
  useThemeStore: vi.fn(),
}))

import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../useTheme'
import { useThemeStore } from '@/shared/store'

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return isDarkMode and toggleTheme', () => {
    const mockToggleTheme = vi.fn()
    vi.mocked(useThemeStore).mockImplementation((selector) => {
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
    vi.mocked(useThemeStore).mockImplementation((selector) => {
      const state = {
        isDarkMode: true,
        toggleTheme: vi.fn(),
      }
      return selector(state)
    })

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDarkMode).toBe(true)
  })

  it('should call toggleTheme when called', () => {
    const mockToggleTheme = vi.fn()
    vi.mocked(useThemeStore).mockImplementation((selector) => {
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
