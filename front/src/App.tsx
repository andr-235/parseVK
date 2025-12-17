import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useTheme } from '@/hooks/useTheme'
import { Sidebar } from '@/components/Sidebar'
import MainContent from '@/components/MainContent'
import AppSyncProvider from '@/lib/providers/AppSyncProvider'

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
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const { isDarkMode } = useTheme()

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
            <Routes>
              <Route path="/" element={<Navigate to="/tasks" replace />} />
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
            </Routes>
          </Suspense>
        </MainContent>
        <Toaster
          position="top-right"
          containerStyle={{
            pointerEvents: 'none',
          }}
          toastOptions={{
            duration: 3000,
            className: 'bg-background-sidebar text-text-light pointer-events-auto',
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
