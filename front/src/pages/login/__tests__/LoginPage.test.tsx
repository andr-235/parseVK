import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from '../LoginPage'
import { ApiError } from '../../../shared/api/client'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockLogin = vi.fn()
vi.mock('../../../store/auth', () => ({
  useAuth: () => ({ login: mockLogin, isLoggingIn: false }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderPage() {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )
  }

  it('renders login form with all fields', () => {
    renderPage()
    expect(screen.getByText('ParseVK')).toBeInTheDocument()
    expect(screen.getByLabelText('Логин')).toBeInTheDocument()
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument()
  })

  it('shows inline validation on blur', async () => {
    const user = userEvent.setup()
    renderPage()
    const usernameInput = screen.getByLabelText('Логин')
    await user.click(usernameInput)
    await user.tab()
    expect(screen.getByText('Введите логин')).toBeInTheDocument()
  })

  it('shows error on empty submit', async () => {
    const user = userEvent.setup()
    renderPage()
    const submitBtn = screen.getByRole('button', { name: 'Войти' })
    await user.click(submitBtn)
    expect(screen.getByText('Заполните все поля')).toBeInTheDocument()
  })

  it('calls login on valid submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    renderPage()

    const usernameInput = screen.getByLabelText('Логин')
    const passwordInput = screen.getByLabelText('Пароль')
    const submitBtn = screen.getByRole('button', { name: 'Войти' })

    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'secret')
    await user.click(submitBtn)

    expect(mockLogin).toHaveBeenCalledWith('admin', 'secret', false)
    expect(mockNavigate).toHaveBeenCalledWith('/comments', { replace: true })
  })

  it('passes rememberMe to login', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    renderPage()

    const usernameInput = screen.getByLabelText('Логин')
    const passwordInput = screen.getByLabelText('Пароль')
    const checkbox = screen.getByRole('checkbox')

    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'secret')
    await user.click(checkbox)
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(mockLogin).toHaveBeenCalledWith('admin', 'secret', true)
  })

  it('shows server error on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(401, 'Unauthorized'))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Логин'), 'admin')
    await user.type(screen.getByLabelText('Пароль'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Неверный логин или пароль')).toBeInTheDocument()
  })

  it('shows rate limit error on 429', async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(429, 'Too Many Requests'))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Логин'), 'admin')
    await user.type(screen.getByLabelText('Пароль'), 'pwd')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Слишком много попыток. Попробуйте позже')).toBeInTheDocument()
  })
})
