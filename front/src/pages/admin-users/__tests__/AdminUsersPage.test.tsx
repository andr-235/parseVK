import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminUsersPage } from '../AdminUsersPage'

const mockFetchUsers = vi.fn()
const mockCreateUser = vi.fn()
const mockUpdateUser = vi.fn()
const mockDeleteUser = vi.fn()
const mockSetTempPassword = vi.fn()
const mockResetPassword = vi.fn()

vi.mock('../../../shared/api/admin-users', () => ({
  fetchAdminUsers: (...args: unknown[]) => mockFetchUsers(...args),
  createAdminUser: (...args: unknown[]) => mockCreateUser(...args),
  updateAdminUser: (...args: unknown[]) => mockUpdateUser(...args),
  deleteAdminUser: (...args: unknown[]) => mockDeleteUser(...args),
  setTemporaryPassword: (...args: unknown[]) => mockSetTempPassword(...args),
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
}))

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

const mockUsers = [
  { id: '1', username: 'admin', role: 'admin', isActive: true, createdAt: '2026-01-01T00:00:00Z', isTemporaryPassword: false },
  { id: '2', username: 'user2', role: 'user', isActive: true, createdAt: '2026-06-01T00:00:00Z', isTemporaryPassword: true },
]

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    mockFetchUsers.mockResolvedValueOnce([])
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    expect(screen.getByText('Админ-панель')).toBeInTheDocument()
  })

  it('shows loading skeleton initially', () => {
    mockFetchUsers.mockReturnValueOnce(new Promise(() => {}))
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows users after loading', async () => {
    mockFetchUsers.mockResolvedValueOnce(mockUsers)
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    expect(await screen.findByText('admin')).toBeInTheDocument()
    expect(await screen.findByText('user2')).toBeInTheDocument()
    expect(await screen.findByText('Админ')).toBeInTheDocument()
    expect(await screen.findByText('Пользователь')).toBeInTheDocument()
    expect(await screen.findByText('ОК')).toBeInTheDocument()
    const tempPwElements = await screen.findAllByText('Врем. пароль')
    expect(tempPwElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no users', async () => {
    mockFetchUsers.mockResolvedValueOnce([])
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    expect(await screen.findByText('Нет пользователей')).toBeInTheDocument()
  })

  it('shows error state on fetch error', async () => {
    mockFetchUsers.mockRejectedValueOnce(new Error('Network error'))
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    expect(await screen.findByText('Network error')).toBeInTheDocument()
  })

  it('expands create row on click', async () => {
    mockFetchUsers.mockResolvedValueOnce([])
    const user = userEvent.setup()
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    await user.click(screen.getByText('Создать пользователя...'))
    expect(screen.getByLabelText('Логин')).toBeInTheDocument()
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument()
    expect(screen.getByLabelText('Роль')).toBeInTheDocument()
  })

  it('shows inline delete confirmation', async () => {
    mockFetchUsers.mockResolvedValueOnce(mockUsers)
    const user = userEvent.setup()
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    await user.click(await screen.findByLabelText('Удалить admin'))
    expect(screen.getByText('Удалить?')).toBeInTheDocument()
    expect(screen.getByText('Да')).toBeInTheDocument()
    expect(screen.getByText('Отмена')).toBeInTheDocument()
  })

  it('cancels inline delete', async () => {
    mockFetchUsers.mockResolvedValueOnce(mockUsers)
    const user = userEvent.setup()
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    await user.click(await screen.findByLabelText('Удалить admin'))
    await user.click(screen.getByText('Отмена'))
    expect(screen.queryByText('Удалить?')).not.toBeInTheDocument()
  })

  it('calls delete mutation on confirm', async () => {
    mockDeleteUser.mockResolvedValueOnce({ status: 'ok' })
    mockFetchUsers.mockResolvedValueOnce(mockUsers)
    const user = userEvent.setup()
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    await user.click(await screen.findByLabelText('Удалить admin'))
    await user.click(screen.getByText('Да'))
    expect(mockDeleteUser).toHaveBeenCalledWith('1')
  })

  it('shows active/inactive badge', async () => {
    mockFetchUsers.mockResolvedValueOnce(mockUsers)
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    const badges = await screen.findAllByText('Активен')
    expect(badges.length).toBe(2)
  })

  it('expands edit row on click', async () => {
    mockFetchUsers.mockResolvedValueOnce(mockUsers)
    const user = userEvent.setup()
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    await user.click(await screen.findByLabelText('Редактировать admin'))
    expect(screen.getByLabelText('Сохранить изменения')).toBeInTheDocument()
    expect(screen.getByLabelText('Отменить редактирование')).toBeInTheDocument()
  })

  it('cancels edit row', async () => {
    mockFetchUsers.mockResolvedValueOnce(mockUsers)
    const user = userEvent.setup()
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    await user.click(await screen.findByLabelText('Редактировать admin'))
    await user.click(screen.getByLabelText('Отменить редактирование'))
    expect(screen.queryByLabelText('Сохранить изменения')).not.toBeInTheDocument()
  })

  it('calls update mutation on save', async () => {
    mockUpdateUser.mockResolvedValueOnce(mockUsers[0])
    mockFetchUsers.mockResolvedValueOnce(mockUsers)
    const user = userEvent.setup()
    render(<AdminUsersPage />, { wrapper: createWrapper() })
    await user.click(await screen.findByLabelText('Редактировать admin'))
    await user.click(screen.getByText('Сохранить'))
    expect(mockUpdateUser).toHaveBeenCalledWith('1', { isActive: true, role: 'admin' })
  })
})
