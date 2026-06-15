import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, setTemporaryPassword, resetPassword } from '../admin-users'

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
const mockApiPatch = vi.fn()
const mockApiDelete = vi.fn()

vi.mock('../client', () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
  apiPost: (...args: unknown[]) => mockApiPost(...args),
  apiPatch: (...args: unknown[]) => mockApiPatch(...args),
  apiDelete: (...args: unknown[]) => mockApiDelete(...args),
}))

describe('admin-users API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchAdminUsers maps snake_case to camelCase', async () => {
    const backend = [{ id: '1', username: 'admin', role: 'admin', is_active: true, created_at: '2026-01-01T00:00:00Z', is_temporary_password: false }]
    mockApiGet.mockResolvedValueOnce(backend)
    const result = await fetchAdminUsers()
    expect(mockApiGet).toHaveBeenCalledWith('/admin/users')
    expect(result).toEqual([{ id: '1', username: 'admin', role: 'admin', isActive: true, createdAt: '2026-01-01T00:00:00Z', isTemporaryPassword: false }])
  })

  it('createAdminUser maps snake_case to camelCase', async () => {
    const backend = { id: '2', username: 'user2', role: 'user', is_active: true, created_at: '2026-06-01T00:00:00Z', is_temporary_password: false }
    mockApiPost.mockResolvedValueOnce(backend)
    const payload = { username: 'user2', password: 'secret', role: 'user' }
    const result = await createAdminUser(payload)
    expect(mockApiPost).toHaveBeenCalledWith('/admin/users', payload)
    expect(result).toEqual({ id: '2', username: 'user2', role: 'user', isActive: true, createdAt: '2026-06-01T00:00:00Z', isTemporaryPassword: false })
  })

  it('updateAdminUser maps snake_case to camelCase', async () => {
    const backend = { id: '1', username: 'admin', role: 'user', is_active: false, created_at: '2026-01-01T00:00:00Z', is_temporary_password: false }
    mockApiPatch.mockResolvedValueOnce(backend)
    const result = await updateAdminUser('1', { isActive: false, role: 'user' })
    expect(mockApiPatch).toHaveBeenCalledWith('/admin/users/1', { is_active: false, role: 'user' })
    expect(result).toEqual({ id: '1', username: 'admin', role: 'user', isActive: false, createdAt: '2026-01-01T00:00:00Z', isTemporaryPassword: false })
  })

  it('deleteAdminUser calls DELETE /admin/users/:id', async () => {
    mockApiDelete.mockResolvedValueOnce({ status: 'ok' })
    const result = await deleteAdminUser('1')
    expect(mockApiDelete).toHaveBeenCalledWith('/admin/users/1')
    expect(result).toEqual({ status: 'ok' })
  })

  it('setTemporaryPassword calls POST /admin/users/:id/set-temporary-password', async () => {
    mockApiPost.mockResolvedValueOnce({ temporaryPassword: 'temp123' })
    const result = await setTemporaryPassword('1')
    expect(mockApiPost).toHaveBeenCalledWith('/admin/users/1/set-temporary-password')
    expect(result.temporaryPassword).toBe('temp123')
  })

  it('resetPassword calls POST /admin/users/:id/reset-password', async () => {
    mockApiPost.mockResolvedValueOnce({ status: 'ok' })
    const result = await resetPassword('1')
    expect(mockApiPost).toHaveBeenCalledWith('/admin/users/1/reset-password')
    expect(result).toEqual({ status: 'ok' })
  })

  it('fetchAdminUsers handles empty list', async () => {
    mockApiGet.mockResolvedValueOnce([])
    const result = await fetchAdminUsers()
    expect(result).toEqual([])
  })
})
