import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockFetchMe = vi.fn()
const mockLogin = vi.fn()
const mockLogout = vi.fn()
const mockChangePassword = vi.fn()
const mockSetAccessToken = vi.fn()

vi.mock('../../shared/api/auth', () => ({
  fetchMe: (...args: unknown[]) => mockFetchMe(...args),
  login: (...args: unknown[]) => mockLogin(...args),
  logout: (...args: unknown[]) => mockLogout(...args),
  changePassword: (...args: unknown[]) => mockChangePassword(...args),
}))

vi.mock('../../shared/api/client', () => ({
  setAccessToken: (...args: unknown[]) => mockSetAccessToken(...args),
}))

const storageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, 'sessionStorage', { value: storageMock })
Object.defineProperty(globalThis, 'localStorage', { value: storageMock })

describe('auth store', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    storageMock.clear()
    const { useAuth } = await import('../auth')
    useAuth.setState({ user: null, isInitialized: false, isLoggingIn: false })
  })

  it('init sets isInitialized when no token', async () => {
    const { useAuth } = await import('../auth')
    await useAuth.getState().init()
    const state = useAuth.getState()
    expect(state.isInitialized).toBe(true)
    expect(state.user).toBeNull()
  })

  it('init restores user from valid token', async () => {
    storageMock.setItem('accessToken', 'valid-token')
    mockFetchMe.mockResolvedValueOnce({ id: '1', username: 'test', role: 'admin', isActive: true, isSuperuser: true })
    const { useAuth } = await import('../auth')
    await useAuth.getState().init()
    const state = useAuth.getState()
    expect(state.user).toEqual({ id: '1', username: 'test', role: 'admin', isActive: true, isSuperuser: true })
    expect(mockSetAccessToken).toHaveBeenCalledWith('valid-token')
  })

  it('init clears invalid token', async () => {
    storageMock.setItem('accessToken', 'bad-token')
    mockFetchMe.mockRejectedValueOnce(new Error('unauthorized'))
    const { useAuth } = await import('../auth')
    await useAuth.getState().init()
    expect(storageMock.getItem('accessToken')).toBeNull()
    expect(mockSetAccessToken).toHaveBeenCalledWith(null)
  })

  it('init checks sessionStorage first, then localStorage', async () => {
    storageMock.setItem('accessToken', 'ls-token')
    mockFetchMe.mockResolvedValueOnce({ id: '2', username: 'ls-user', role: 'user', isActive: true, isSuperuser: false })
    const { useAuth } = await import('../auth')
    await useAuth.getState().init()
    expect(mockSetAccessToken).toHaveBeenCalledWith('ls-token')
    const state = useAuth.getState()
    expect(state.user?.username).toBe('ls-user')
  })

  it('login stores token in sessionStorage by default', async () => {
    mockLogin.mockResolvedValueOnce({ accessToken: 'new-token', user: { id: '1', username: 'u', role: 'admin', isActive: true, isSuperuser: false } })
    const { useAuth } = await import('../auth')
    await useAuth.getState().login('u', 'p')
    expect(storageMock.getItem('accessToken')).toBe('new-token')
    expect(mockSetAccessToken).toHaveBeenCalledWith('new-token')
  })

  it('login with rememberMe stores token in localStorage', async () => {
    mockLogin.mockResolvedValueOnce({ accessToken: 'persist-token', user: { id: '1', username: 'u', role: 'admin', isActive: true, isSuperuser: false } })
    const { useAuth } = await import('../auth')
    await useAuth.getState().login('u', 'p', true)
    expect(storageMock.getItem('accessToken')).toBe('persist-token')
  })

  it('login sets isLoggingIn correctly', async () => {
    mockLogin.mockResolvedValueOnce({ accessToken: 't', user: { id: '1', username: 'u', role: 'admin', isActive: true, isSuperuser: false } })
    const { useAuth } = await import('../auth')
    const promise = useAuth.getState().login('u', 'p')
    expect(useAuth.getState().isLoggingIn).toBe(true)
    await promise
    expect(useAuth.getState().isLoggingIn).toBe(false)
  })

  it('login throws on failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('invalid credentials'))
    const { useAuth } = await import('../auth')
    await expect(useAuth.getState().login('u', 'wrong')).rejects.toThrow('invalid credentials')
    expect(useAuth.getState().isLoggingIn).toBe(false)
  })

  it('logout clears token and user', async () => {
    mockLogout.mockResolvedValueOnce({ status: 'ok' })
    storageMock.setItem('accessToken', 't')
    const { useAuth } = await import('../auth')
    useAuth.setState({ user: { id: '1', username: 'u', role: 'admin', isActive: true, isSuperuser: false } })
    await useAuth.getState().logout()
    expect(storageMock.getItem('accessToken')).toBeNull()
    expect(mockSetAccessToken).toHaveBeenCalledWith(null)
    expect(useAuth.getState().user).toBeNull()
  })

  it('changePassword rotates token', async () => {
    mockChangePassword.mockResolvedValueOnce({ accessToken: 'rotated', user: { id: '1', username: 'u', role: 'admin', isActive: true, isSuperuser: false } })
    storageMock.setItem('accessToken', 'old-token')
    const { useAuth } = await import('../auth')
    await useAuth.getState().changePassword('old', 'new')
    expect(storageMock.getItem('accessToken')).toBe('rotated')
    expect(mockSetAccessToken).toHaveBeenCalledWith('rotated')
  })

  it('setUser updates user in store', async () => {
    const { useAuth } = await import('../auth')
    const user = { id: '1', username: 'u', role: 'user', isActive: true, isSuperuser: false }
    useAuth.getState().setUser(user)
    expect(useAuth.getState().user).toEqual(user)
  })
})
