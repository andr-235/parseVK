import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchAdminUsers, resetPassword, updateAdminUser } from '../admin-users'

const apiGet = vi.fn()
const apiPost = vi.fn()
const apiPatch = vi.fn()

vi.mock('../client', () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
  apiPost: (...args: unknown[]) => apiPost(...args),
  apiPatch: (...args: unknown[]) => apiPatch(...args),
  apiDelete: vi.fn(),
}))

describe('admin-users API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps a paginated response and forwards the actual query', async () => {
    const query = { page: 2, pageSize: 25, search: 'adm', sortBy: 'createdAt' as const, sortDir: 'desc' as const }
    apiGet.mockResolvedValue({
      items: [{ id: '1', username: 'admin', role: 'admin', is_active: true, created_at: '2026-01-01T00:00:00Z', is_temporary_password: true }],
      page: 2, pageSize: 25, total: 26, totalPages: 2,
    })

    const result = await fetchAdminUsers(query)

    expect(apiGet).toHaveBeenCalledWith('/admin/users', query)
    expect(result.items[0]).toMatchObject({ username: 'admin', isTemporaryPassword: true })
    expect(result.totalPages).toBe(2)
  })

  it('maps update payload to snake case', async () => {
    apiPatch.mockResolvedValue({ id: '1', username: 'u', role: 'user', is_active: false, created_at: '2026-01-01T00:00:00Z', is_temporary_password: false })
    await updateAdminUser('1', { role: 'user', isActive: false })
    expect(apiPatch).toHaveBeenCalledWith('/admin/users/1', { role: 'user', is_active: false })
  })

  it('returns the generated password from reset', async () => {
    apiPost.mockResolvedValue({ temporaryPassword: 'generated-password' })
    await expect(resetPassword('1')).resolves.toEqual({ temporaryPassword: 'generated-password' })
  })
})
