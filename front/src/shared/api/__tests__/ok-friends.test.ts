import { describe, it, expect, vi, beforeEach } from 'vitest'
import { startOkFriendsExport, getOkFriendsJob, downloadOkFriendsXlsx } from '../ok-friends'

const mockApiPost = vi.fn()
const mockApiGet = vi.fn()
const mockApiGetBlob = vi.fn()

vi.mock('../client', () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args),
  apiGet: (...args: unknown[]) => mockApiGet(...args),
  apiGetBlob: (...args: unknown[]) => mockApiGetBlob(...args),
}))

describe('ok-friends API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('startOkFriendsExport calls POST /ok/friends/export with fid', async () => {
    mockApiPost.mockResolvedValueOnce({ jobId: 'job-1', status: 'PENDING' })
    const result = await startOkFriendsExport({ fid: '67890' })
    expect(mockApiPost).toHaveBeenCalledWith('/ok/friends/export', { params: { fid: '67890' } })
    expect(result.jobId).toBe('job-1')
    expect(result.status).toBe('PENDING')
  })

  it('startOkFriendsExport works without params', async () => {
    mockApiPost.mockResolvedValueOnce({ jobId: 'job-2', status: 'PENDING' })
    const result = await startOkFriendsExport({})
    expect(mockApiPost).toHaveBeenCalledWith('/ok/friends/export', { params: {} })
    expect(result.jobId).toBe('job-2')
  })

  it('getOkFriendsJob calls GET /ok/friends/jobs/{id}', async () => {
    const backend = {
      job: {
        id: 'job-1', status: 'DONE', fetchedCount: 5, totalCount: 20,
        warning: null, error: null, xlsxPath: '/tmp/ok.xlsx', createdAt: '2026-06-29T00:00:00Z',
      },
      logs: [],
    }
    mockApiGet.mockResolvedValueOnce(backend)
    const result = await getOkFriendsJob('job-1')
    expect(mockApiGet).toHaveBeenCalledWith('/ok/friends/jobs/job-1')
    expect(result.job.id).toBe('job-1')
    expect(result.job.status).toBe('DONE')
    expect(result.logs).toHaveLength(0)
  })

  it('downloadOkFriendsXlsx calls GET blob', async () => {
    const blob = new Blob(['ok-data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    mockApiGetBlob.mockResolvedValueOnce(blob)
    const result = await downloadOkFriendsXlsx('job-1')
    expect(mockApiGetBlob).toHaveBeenCalledWith('/ok/friends/jobs/job-1/download/xlsx')
    expect(result).toBe(blob)
  })

  it('propagates ApiError on failure', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('Network error'))
    await expect(startOkFriendsExport({ fid: '1' })).rejects.toThrow('Network error')
  })
})
