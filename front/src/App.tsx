import { useEffect, Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Sidebar } from '@/shared/components/common/Sidebar'
import MainContent from '@/shared/components/common/MainContent'
import AppSyncProvider from '@/shared/providers/AppSyncProvider'
import { useAuthStore } from '@/shared/auth/store'

// Lazy load pages
const Tasks = lazy(() => import('@/pages/tasks'))
const Groups = lazy(() => import('@/pages/groups'))
const Comments = lazy(() => import('@/pages/comments'))
const Keywords = lazy(() => import('@/pages/keywords'))
const Watchlist = lazy(() => import('@/pages/watchlist'))
const AuthorAnalysis = lazy(() => import('@/pages/author-analysis'))
const Authors = lazy(() => import('@/pages/authors'))
const Settings = lazy(() => import('@/pages/settings'))
const Listings = lazy(() => import('@/pages/listings'))
const Telegram = lazy(() => import('@/pages/telegram'))
const TgmbaseSearch = lazy(() => import('@/pages/tgmbase-search'))
const TelegramDlUpload = lazy(() => import('@/pages/telegram-dl-upload'))
const Metrics = lazy(() => import('@/pages/metrics'))
const Monitoring = lazy(() => import('@/pages/monitoring'))
const MonitoringGroups = lazy(() => import('@/pages/monitoring-groups'))
const Login = lazy(() => import('@/pages/login'))
const AdminUsers = lazy(() => import('@/pages/admin-users'))
const ChangePassword = lazy(() => import('@/pages/change-password'))
const VkFriendsExportPage = lazy(() => import('@/pages/vk-friends-export'))
const OkFriendsExportPage = lazy(() => import('@/pages/ok-friends-export'))
import { ErrorBoundary } from '@/shared/components/common/ErrorBoundary'
import { Spinner } from '@/shared/components/ui/spinner'

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
              <Spinner className="size-8 text-accent-primary" />
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
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.user))

  // Зафиксируем темную тему
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

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
            <Route path="/tgmbase-search" element={<TgmbaseSearch />} />
            <Route path="/telegram/dl-upload" element={<TelegramDlUpload />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/monitoring" element={<Navigate to="/monitoring/whatsapp" replace />} />
            <Route path="/monitoring/:sourceKey" element={<Monitoring />} />
            <Route path="/monitoring/:sourceKey/groups" element={<MonitoringGroups />} />
            <Route path="/vk/friends-export" element={<VkFriendsExportPage />} />
            <Route path="/ok/friends-export" element={<OkFriendsExportPage />} />
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
                  <div className="flex min-h-screen items-center justify-center">
                    <Spinner className="size-8 text-accent-primary" />
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
