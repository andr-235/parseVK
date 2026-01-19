import { useEffect, Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useTheme } from '@/hooks/useTheme'
import { Sidebar } from '@/components/Sidebar'
import MainContent from '@/components/MainContent'
import AppSyncProvider from '@/lib/providers/AppSyncProvider'
import { useAuthStore } from '@/store'

// Lazy load pages
const Tasks = lazy(() => import('@/pages/Tasks'))
const Groups = lazy(() => import('@/pages/Groups'))
const Comments = lazy(() => import('@/pages/Comments'))
const Keywords = lazy(() => import('@/pages/Keywords'))
const Watchlist = lazy(() => import('@/pages/Watchlist'))
const AuthorAnalysis = lazy(() => import('@/pages/AuthorAnalysis'))
const Authors = lazy(() => import('@/pages/Authors'))
const Settings = lazy(() => import('@/pages/Settings'))
const Listings = lazy(() => import('@/pages/Listings'))
const Telegram = lazy(() => import('@/pages/Telegram'))
const Metrics = lazy(() => import('@/pages/Metrics'))
const Monitoring = lazy(() => import('@/pages/Monitoring'))
const Login = lazy(() => import('@/pages/Login'))
const AdminUsers = lazy(() => import('@/pages/AdminUsers'))
const ChangePassword = lazy(() => import('@/pages/ChangePassword'))
import { ErrorBoundary } from './components/ErrorBoundary'

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.user))
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((state) => state.user)

  if (!user || user.role !== 'admin') {
    return <Navigate to="/tasks" replace />
  }

  return <>{children}</>
}

const RequirePasswordChange = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (user?.isTemporaryPassword && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const AppLayout = () => {
  return (
    <>
      <AppSyncProvider />
      <Sidebar />
      <MainContent>
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">Загрузка...</div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </MainContent>
    </>
  )
}

function App() {
  const { isDarkMode } = useTheme()
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.user))

  useEffect(() => {
    const root = document.documentElement

    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    return () => {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <RequireAuth>
                <RequirePasswordChange>
                  <AppLayout />
                </RequirePasswordChange>
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/comments" element={<Comments />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/authors/:vkUserId/analysis" element={<AuthorAnalysis />} />
            <Route path="/keywords" element={<Keywords />} />
            <Route path="/authors" element={<Authors />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/telegram" element={<Telegram />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route
              path="/admin/users"
              element={
                <RequireAdmin>
                  <AdminUsers />
                </RequireAdmin>
              }
            />
          </Route>
          <Route
            path="/login"
            element={
              <Suspense
                fallback={
                  <div className="flex min-h-screen items-center justify-center text-muted-foreground">
                    Загрузка...
                  </div>
                }
              >
                <Login />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? '/tasks' : '/login'} replace />}
          />
        </Routes>
        <Toaster
          position="top-right"
          containerStyle={{
            pointerEvents: 'none',
          }}
          toastOptions={{
            duration: 3000,
            className: 'bg-foreground text-background pointer-events-auto shadow-soft-sm',
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
