import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useThemeStore } from './stores'
import { Sidebar } from './components/Sidebar'
import MainContent from './components/MainContent'
import Tasks from './pages/Tasks'
import Groups from './pages/Groups'
import Comments from './pages/Comments'
import Keywords from './pages/Keywords'
import Watchlist from './pages/Watchlist'
import AuthorAnalysis from './pages/AuthorAnalysis'
import Authors from './pages/Authors'
import Settings from './pages/Settings'
import Listings from './pages/Listings'
import Telegram from './pages/Telegram'
import AppSyncProvider from './providers/AppSyncProvider'

function App() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)

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
    <BrowserRouter>
      <AppSyncProvider />
      <Sidebar />
      <MainContent>
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
        </Routes>
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
  )
}

export default App
