import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useComments } from '../useComments'

const mockFetchComments = vi.fn()
vi.mock('../../api/comments', () => ({
  fetchComments: (...args: unknown[]) => mockFetchComments(...args),
}))

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('useComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches comments with given params', async () => {
    const data = { comments: [{ id: 1, text: 'Test', group: 'G', author: 'A', date: '01.01.2026', status: 'Новый' as const }], total: 1 }
    mockFetchComments.mockResolvedValueOnce(data)

    const { result } = renderHook(() => useComments({ page: 1, pageSize: 10 }), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(data)
    expect(mockFetchComments).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
  })

  it('re-fetches when params change', async () => {
    mockFetchComments.mockResolvedValue({ comments: [], total: 0 })

    const { result, rerender } = renderHook(
      (params) => useComments(params),
      { initialProps: { page: 1, pageSize: 10 }, wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetchComments).toHaveBeenCalledTimes(1)

    rerender({ page: 2, pageSize: 10 })
    await waitFor(() => expect(mockFetchComments).toHaveBeenCalledTimes(2))
    expect(mockFetchComments).toHaveBeenLastCalledWith({ page: 2, pageSize: 10 })
  })

  it('keeps previous data as placeholder while loading', async () => {
    const prevData = { comments: [{ id: 1, text: 'Old', group: 'G', author: 'A', date: '01.01.2026', status: 'Новый' as const }], total: 1 }
    mockFetchComments.mockResolvedValueOnce(prevData)

    const { result, rerender } = renderHook(
      (params) => useComments(params),
      { initialProps: { page: 1, pageSize: 10 }, wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    mockFetchComments.mockImplementationOnce(() => new Promise(() => {}))

    rerender({ page: 2, pageSize: 10 })
    await waitFor(() => expect(result.current.isFetching).toBe(true))
    expect(result.current.data).toEqual(prevData)
  })
})
