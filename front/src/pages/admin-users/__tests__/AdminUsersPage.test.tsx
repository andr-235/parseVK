import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminUsersPage } from '../AdminUsersPage'

const fetchUsers = vi.fn()
const reset = vi.fn()

vi.mock('../../../shared/api/admin-users', async (original) => {
  const actual = await original<typeof import('../../../shared/api/admin-users')>()
  return {
    ...actual,
    fetchAdminUsers: (...args: unknown[]) => fetchUsers(...args),
    resetPassword: (...args: unknown[]) => reset(...args),
  }
})

const page = {
  items: [{ id: '1', username: 'admin', role: 'admin' as const, isActive: true, createdAt: '2026-01-01T00:00:00Z', isTemporaryPassword: false }],
  page: 1, pageSize: 25, total: 1, totalPages: 1,
}

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchUsers.mockResolvedValue(page)
  })

  it('renders users with exactly six table headers', async () => {
    render(<AdminUsersPage />, { wrapper: wrapper() })
    expect(await screen.findByText('admin')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(6)
  })

  it('shows the password returned by reset', async () => {
    reset.mockResolvedValue({ temporaryPassword: 'one-time-password' })
    const user = userEvent.setup()
    render(<AdminUsersPage />, { wrapper: wrapper() })
    await user.click(await screen.findByLabelText('Сбросить пароль для admin'))
    await user.click(screen.getByText('Да'))
    expect(await screen.findByText('one-time-password')).toBeInTheDocument()
  })

  it('sends debounced search to the backend query', async () => {
    const user = userEvent.setup()
    render(<AdminUsersPage />, { wrapper: wrapper() })
    await user.type(screen.getByLabelText('Поиск пользователей'), 'adm')
    await waitFor(() => expect(fetchUsers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'adm' })))
  })
})
