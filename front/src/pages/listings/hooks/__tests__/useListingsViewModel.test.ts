import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useListingsViewModel } from '../useListingsViewModel'

describe('useListingsViewModel', () => {
  it('resets summary state on manual refresh', () => {
    const { result } = renderHook(() => useListingsViewModel())

    act(() => {
      result.current.handleMetaChange({
        total: 12,
        sources: ['avito', 'cian'],
      })
      result.current.handleItemsChange(12)
      result.current.handleLoadingChange(false)
    })

    expect(result.current.summaryText).toBe('12 из 12')
    expect(result.current.filterOptions).toEqual(['all', 'avito', 'cian'])

    act(() => {
      result.current.handleManualRefresh()
    })

    expect(result.current.summaryText).toBe('Загружаем объявления…')
    expect(result.current.filterOptions).toEqual(['all'])
  })
})
