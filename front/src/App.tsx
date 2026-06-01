import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { CommentsPage } from './pages/comments/CommentsPage'
import { TasksPage } from './pages/tasks/TasksPage'
import { GroupsPage } from './pages/groups/GroupsPage'
import { AuthorsPage } from './pages/authors/AuthorsPage'
import { AuthorAnalysisPage } from './pages/author-analysis/AuthorAnalysisPage'
import { WatchlistPage } from './pages/watchlist/WatchlistPage'
import { KeywordsPage } from './pages/keywords/KeywordsPage'
import { TelegramPage } from './pages/telegram/TelegramPage'
import { TelegramDlUploadPage } from './pages/telegram-dl-upload/TelegramDlUploadPage'
import { TgmbaseSearchPage } from './pages/tgmbase-search/TgmbaseSearchPage'
import { MonitoringPage } from './pages/monitoring/MonitoringPage'
import { MonitoringGroupsPage } from './pages/monitoring-groups/MonitoringGroupsPage'
import { ListingsPage } from './pages/listings/ListingsPage'
import { VkFriendsExportPage } from './pages/vk-friends-export/VkFriendsExportPage'
import { OkFriendsExportPage } from './pages/ok-friends-export/OkFriendsExportPage'
import { MetricsPage } from './pages/metrics/MetricsPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { AdminUsersPage } from './pages/admin-users/AdminUsersPage'
import { LoginPage } from './pages/login/LoginPage'
import { ChangePasswordPage } from './pages/change-password/ChangePasswordPage'
import { useAuth } from './store/auth'
import { Skeleton } from './components/ui'

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
            <Route path="/telegram" element={<TelegramPage />} />
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
    </BrowserRouter>
  )
}

export default App
