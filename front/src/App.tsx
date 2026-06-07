import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Skeleton } from './components/ui'

const CommentsPage = lazy(() => import('./pages/comments/CommentsPage').then(m => ({ default: m.CommentsPage })))
const TasksPage = lazy(() => import('./pages/tasks/TasksPage').then(m => ({ default: m.TasksPage })))
const GroupsPage = lazy(() => import('./pages/groups/GroupsPage').then(m => ({ default: m.GroupsPage })))
const AuthorsPage = lazy(() => import('./pages/authors/AuthorsPage').then(m => ({ default: m.AuthorsPage })))
const AuthorAnalysisPage = lazy(() => import('./pages/author-analysis/AuthorAnalysisPage').then(m => ({ default: m.AuthorAnalysisPage })))
const WatchlistPage = lazy(() => import('./pages/watchlist/WatchlistPage').then(m => ({ default: m.WatchlistPage })))
const KeywordsPage = lazy(() => import('./pages/keywords/KeywordsPage').then(m => ({ default: m.KeywordsPage })))
const TelegramDlUploadPage = lazy(() => import('./pages/telegram-dl-upload/TelegramDlUploadPage').then(m => ({ default: m.TelegramDlUploadPage })))
const TgmbaseSearchPage = lazy(() => import('./pages/tgmbase-search/TgmbaseSearchPage').then(m => ({ default: m.TgmbaseSearchPage })))
const MonitoringPage = lazy(() => import('./pages/monitoring/MonitoringPage').then(m => ({ default: m.MonitoringPage })))
const MonitoringGroupsPage = lazy(() => import('./pages/monitoring-groups/MonitoringGroupsPage').then(m => ({ default: m.MonitoringGroupsPage })))
const ListingsPage = lazy(() => import('./pages/listings/ListingsPage').then(m => ({ default: m.ListingsPage })))
const VkFriendsExportPage = lazy(() => import('./pages/vk-friends-export/VkFriendsExportPage').then(m => ({ default: m.VkFriendsExportPage })))
const OkFriendsExportPage = lazy(() => import('./pages/ok-friends-export/OkFriendsExportPage').then(m => ({ default: m.OkFriendsExportPage })))
const MetricsPage = lazy(() => import('./pages/metrics/MetricsPage').then(m => ({ default: m.MetricsPage })))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const AdminUsersPage = lazy(() => import('./pages/admin-users/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })))
const LoginPage = lazy(() => import('./pages/login/LoginPage').then(m => ({ default: m.LoginPage })))
const ChangePasswordPage = lazy(() => import('./pages/change-password/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })))
import { useAuth } from './store/auth'

function AuthOutlet() {
  const { user, isInitialized, init } = useAuth()

  useEffect(() => {
    init()
  }, [init])

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-main">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="mx-auto h-7 w-32" />
          <div className="space-y-4 rounded-lg border border-border bg-bg-panel p-6">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-bg-main"><Skeleton className="h-6 w-48" /></div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthOutlet />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/comments" replace />} />
            <Route path="/comments" element={<CommentsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/authors" element={<AuthorsPage />} />
            <Route path="/authors/:vkUserId/analysis" element={<AuthorAnalysisPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/keywords" element={<KeywordsPage />} />
            <Route path="/telegram" element={<Navigate to="/telegram/dl-upload" replace />} />
            <Route path="/telegram/dl-upload" element={<TelegramDlUploadPage />} />
            <Route path="/tgmbase-search" element={<TgmbaseSearchPage />} />
            <Route path="/monitoring/whatsapp" element={<MonitoringPage messenger="WhatsApp" />} />
            <Route path="/monitoring/whatsapp/groups" element={<MonitoringGroupsPage messenger="WhatsApp" />} />
            <Route path="/monitoring/max" element={<MonitoringPage messenger="Max" />} />
            <Route path="/monitoring/max/groups" element={<MonitoringGroupsPage messenger="Max" />} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/vk/friends-export" element={<VkFriendsExportPage />} />
            <Route path="/ok/friends-export" element={<OkFriendsExportPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
