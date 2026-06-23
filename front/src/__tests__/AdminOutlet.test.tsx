import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AdminOutlet, AuthOutlet } from '../App'
import { useAuth } from '../store/auth'

function renderRoute(role: 'admin' | 'user') {
  useAuth.setState({
    user: { id: '1', username: 'tester', role, isActive: true, isSuperuser: false },
    isInitialized: true,
  })
  return render(
    <MemoryRouter initialEntries={['/admin/users']}>
      <Routes>
        <Route element={<AdminOutlet />}>
          <Route path="/admin/users" element={<p>admin-page</p>} />
        </Route>
        <Route path="/comments" element={<p>comments-page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminOutlet', () => {
  afterEach(() => useAuth.setState({ user: null, isInitialized: false }))

  it('renders admin routes for administrators', () => {
    renderRoute('admin')
    expect(screen.getByText('admin-page')).toBeInTheDocument()
  })

  it('redirects non-admin users', () => {
    renderRoute('user')
    expect(screen.getByText('comments-page')).toBeInTheDocument()
  })

  it('forces temporary-password users to change their password', () => {
    useAuth.setState({
      user: { id: '1', username: 'tester', role: 'user', isActive: true, isSuperuser: false, isTemporaryPassword: true },
      isInitialized: true,
    })
    render(
      <MemoryRouter initialEntries={['/comments']}>
        <Routes>
          <Route element={<AuthOutlet />}>
            <Route path="/comments" element={<p>comments-page</p>} />
            <Route path="/change-password" element={<p>change-password-page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('change-password-page')).toBeInTheDocument()
  })
})
