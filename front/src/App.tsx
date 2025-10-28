import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useThemeStore } from './stores'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import Tasks from './pages/Tasks'
import Groups from './pages/Groups'
import Comments from './pages/Comments'
import Keywords from './pages/Keywords'
import Watchlist from './pages/Watchlist'
import AuthorAnalysis from './pages/AuthorAnalysis'
import Authors from './pages/Authors'
import Settings from './pages/Settings'
import RealEstateReports from './pages/RealEstateReports'
import TasksSyncProvider from './providers/TasksSyncProvider'
import RealEstateParsing from './pages/RealEstateParsing'

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
      <TasksSyncProvider />
      <div className="flex min-h-screen w-full bg-background-primary text-text-primary transition-colors duration-300">
        <Sidebar title="ВК Аналитик" />
        <MainContent>
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/comments" element={<Comments />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/authors/:vkUserId/analysis" element={<AuthorAnalysis />} />
            <Route path="/keywords" element={<Keywords />} />
            <Route path="/authors" element={<Authors />} />
            <Route path="/reports" element={<RealEstateReports />} />
            <Route path="/real-estate/parsing" element={<RealEstateParsing />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MainContent>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--bg-sidebar)',
              color: 'var(--text-light)',
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}

export default App
