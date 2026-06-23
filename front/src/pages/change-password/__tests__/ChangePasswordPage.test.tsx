import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ChangePasswordPage } from '../ChangePasswordPage'
import { ApiError } from '../../../shared/api/client'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockChangePassword = vi.fn()
vi.mock('../../../store/auth', () => ({
  useAuth: () => ({ changePassword: mockChangePassword }),
}))

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderPage() {
    return render(
      <BrowserRouter>
        <ChangePasswordPage />
      </BrowserRouter>
    )
  }

  it('renders form with all fields', () => {
    renderPage()
    expect(screen.getByText('Смена пароля')).toBeInTheDocument()
    expect(screen.getByLabelText('Старый пароль')).toBeInTheDocument()
    expect(screen.getByLabelText('Новый пароль')).toBeInTheDocument()
    expect(screen.getByLabelText('Подтверждение')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сменить пароль' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Назад' })).toBeInTheDocument()
  })

  it('shows hint for new password', () => {
    renderPage()
    expect(screen.getByText('минимум 8 символов')).toBeInTheDocument()
  })

  it('shows inline validation on blur', async () => {
    const user = userEvent.setup()
    renderPage()
    const oldPwd = screen.getByLabelText('Старый пароль')
    await user.click(oldPwd)
    await user.tab()
    expect(screen.getByText('Введите старый пароль')).toBeInTheDocument()
  })

  it('shows error on empty submit', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Сменить пароль' }))
    expect(screen.getByText('Заполните все поля')).toBeInTheDocument()
  })

  it('validates new password length on blur', async () => {
    const user = userEvent.setup()
    renderPage()
    const newPwd = screen.getByLabelText('Новый пароль')
    await user.click(newPwd)
    await user.tab()
    expect(screen.getByText('Введите новый пароль')).toBeInTheDocument()
  })

  it('validates confirm password match on blur', async () => {
    const user = userEvent.setup()
    renderPage()
    const oldPwd = screen.getByLabelText('Старый пароль')
    const newPwd = screen.getByLabelText('Новый пароль')
    const confirmPwd = screen.getByLabelText('Подтверждение')

    await user.type(oldPwd, 'oldpass')
    await user.type(newPwd, 'newpass12345')
    await user.type(confirmPwd, 'different')
    await user.tab()

    expect(screen.getByText('Пароли не совпадают')).toBeInTheDocument()
  })

  it('calls changePassword on valid submit', async () => {
    mockChangePassword.mockResolvedValueOnce({ accessToken: 'new', user: { id: '1', username: 'u', role: 'admin', isActive: true, isSuperuser: false } })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Старый пароль'), 'oldpass')
    await user.type(screen.getByLabelText('Новый пароль'), 'newpass12345')
    await user.type(screen.getByLabelText('Подтверждение'), 'newpass12345')
    await user.click(screen.getByRole('button', { name: 'Сменить пароль' }))

    expect(mockChangePassword).toHaveBeenCalledWith('oldpass', 'newpass12345')
  })

  it('shows success after change', async () => {
    mockChangePassword.mockResolvedValueOnce({ accessToken: 'new', user: { id: '1', username: 'u', role: 'admin', isActive: true, isSuperuser: false } })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Старый пароль'), 'oldpass')
    await user.type(screen.getByLabelText('Новый пароль'), 'newpass12345')
    await user.type(screen.getByLabelText('Подтверждение'), 'newpass12345')
    await user.click(screen.getByRole('button', { name: 'Сменить пароль' }))

    expect(await screen.findByText('Пароль успешно изменён')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сменить пароль' })).toBeDisabled()
  })

  it('shows error on failed change', async () => {
    mockChangePassword.mockRejectedValueOnce(new ApiError(401, 'Wrong old password'))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Старый пароль'), 'wrong')
    await user.type(screen.getByLabelText('Новый пароль'), 'newpass12345')
    await user.type(screen.getByLabelText('Подтверждение'), 'newpass12345')
    await user.click(screen.getByRole('button', { name: 'Сменить пароль' }))

    expect(await screen.findByText('Старый пароль неправильный')).toBeInTheDocument()
  })

  it('navigates home on back button click', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Назад' }))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
