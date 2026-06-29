import { describe, it, expect, vi, beforeEach } from 'vitest'
import { startVkFriendsExport, getVkFriendsJob, downloadVkFriendsXlsx } from '../vk-friends'

const mockApiPost = vi.fn()
const mockApiGet = vi.fn()
const mockApiGetBlob = vi.fn()

vi.mock('../client', () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args),
  apiGet: (...args: unknown[]) => mockApiGet(...args),
  apiGetBlob: (...args: unknown[]) => mockApiGetBlob(...args),
}))

describe('vk-friends API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('startVkFriendsExport calls POST /vk/friends/export', async () => {
    mockApiPost.mockResolvedValueOnce({ jobId: 'job-1', status: 'PENDING' })
    const result = await startVkFriendsExport({ user_id: 12345 })
    expect(mockApiPost).toHaveBeenCalledWith('/vk/friends/export', { params: { user_id: 12345 } })
    expect(result.jobId).toBe('job-1')
    expect(result.status).toBe('PENDING')
  })

  it('startVkFriendsExport works without params', async () => {
    mockApiPost.mockResolvedValueOnce({ jobId: 'job-2', status: 'PENDING' })
    const result = await startVkFriendsExport({})
    expect(mockApiPost).toHaveBeenCalledWith('/vk/friends/export', { params: {} })
    expect(result.jobId).toBe('job-2')
  })

  it('getVkFriendsJob calls GET /vk/friends/jobs/{id}', async () => {
    const backend = {
      job: {
        id: 'job-1', status: 'DONE', fetchedCount: 10, totalCount: 50,
        warning: null, error: null, xlsxPath: '/tmp/file.xlsx', createdAt: '2026-06-29T00:00:00Z',
      },
      logs: [],
    }
    mockApiGet.mockResolvedValueOnce(backend)
    const result = await getVkFriendsJob('job-1')
    expect(mockApiGet).toHaveBeenCalledWith('/vk/friends/jobs/job-1')
    expect(result.job.id).toBe('job-1')
    expect(result.job.status).toBe('DONE')
    expect(result.logs).toHaveLength(0)
  })

  it('downloadVkFriendsXlsx calls GET blob', async () => {
    const blob = new Blob(['fake'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    mockApiGetBlob.mockResolvedValueOnce(blob)
    const result = await downloadVkFriendsXlsx('job-1')
    expect(mockApiGetBlob).toHaveBeenCalledWith('/vk/friends/jobs/job-1/download/xlsx')
    expect(result).toBe(blob)
  })

  it('propagates ApiError on failure', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('Network error'))
    await expect(startVkFriendsExport({ user_id: 1 })).rejects.toThrow('Network error')
  })
})
