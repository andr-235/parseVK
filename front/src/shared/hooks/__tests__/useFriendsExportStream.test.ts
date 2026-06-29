import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useFriendsExportStream } from '../useFriendsExportStream'

const mockToken = 'test-access-token'
const mockStreamUrlBuilder = (id: string) => `/stream/${id}`

vi.mock('../../api/client', () => ({
  getAccessToken: () => mockToken,
}))

function createMockReader(chunks: Uint8Array[]) {
  let index = 0
  return {
    read: async () => {
      if (index < chunks.length) {
        return { done: false as const, value: chunks[index++] }
      }
      return { done: true as const, value: undefined as const }
    },
    cancel: vi.fn(),
    releaseLock: vi.fn(),
  }
}

describe('useFriendsExportStream', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should send Authorization header on connect', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => createMockReader([]) },
    })
    vi.stubGlobal('fetch', mockFetch)

    renderHook(() => useFriendsExportStream('job-123', mockStreamUrlBuilder))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/stream/job-123',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        }),
      )
    })
  })

  it('should set status to done on done event', async () => {
    const doneEvent = JSON.stringify({ type: 'done', data: { xlsxPath: '/files/export.xlsx', fetchedCount: 10, totalCount: 10, jobId: 'job-123', status: 'DONE', warning: null } })
    const chunk = new TextEncoder().encode(`data: ${doneEvent}\n\n`)
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => createMockReader([chunk]) },
    })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useFriendsExportStream('job-123', mockStreamUrlBuilder))

    await waitFor(() => expect(result.current.status).toBe('done'))
    expect(result.current.xlsxPath).toBe('/files/export.xlsx')
  })

  it('should set status to error on 401 response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useFriendsExportStream('job-123', mockStreamUrlBuilder))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
      expect(result.current.error).toContain('Unauthorized')
    })
  })

  it('should update progress and logs during stream', async () => {
    const progressEvent = JSON.stringify({ type: 'progress', data: { fetchedCount: 5, totalCount: 10, limitApplied: false } })
    const logEvent = JSON.stringify({ type: 'log', data: { level: 'info', message: 'Processing...', meta: null } })
    const doneEvent = JSON.stringify({ type: 'done', data: { xlsxPath: '/files/export.xlsx', fetchedCount: 10, totalCount: 10, jobId: 'job-123', status: 'DONE', warning: null } })
    const chunk = new TextEncoder().encode(
      `data: ${progressEvent}\n\ndata: ${logEvent}\n\ndata: ${doneEvent}\n\n`,
    )
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => createMockReader([chunk]) },
    })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useFriendsExportStream('job-123', mockStreamUrlBuilder))

    await waitFor(() => {
      expect(result.current.status).toBe('done')
      expect(result.current.progress.fetchedCount).toBe(5)
      expect(result.current.logs.length).toBe(1)
    })
  })

  it('should reset state correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => createMockReader([]) },
    })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useFriendsExportStream('job-123', mockStreamUrlBuilder))

    await waitFor(() => expect(result.current.status).toBe('connecting'))

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.logs).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should retry on 404 and succeed when job becomes available', async () => {
    vi.useRealTimers()

    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({ ok: false, status: 404 })
      }
      return Promise.resolve({ ok: true, body: { getReader: () => createMockReader([]) } })
    })
    vi.stubGlobal('fetch', mockFetch)

    renderHook(() => useFriendsExportStream('job-123', mockStreamUrlBuilder))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2), { timeout: 5000 })
  })

  it('should set error after exhausting 404 retries', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useFriendsExportStream('job-123', mockStreamUrlBuilder))

    await vi.advanceTimersByTimeAsync(10_000)

    await waitFor(() => {
      expect(result.current.status).toBe('error')
      expect(result.current.error).toContain('404')
    })
  })
})
