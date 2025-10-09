import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useThemeStore } from './stores'
import AppSidebar from './components/Sidebar'
import { SidebarProvider, SidebarInset } from './components/ui/sidebar'
import Tasks from './pages/Tasks'
import Groups from './pages/Groups'
import Comments from './pages/Comments'
import Keywords from './pages/Keywords'

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
      <div className="flex h-screen flex-col bg-background-primary text-text-primary transition-colors duration-300 lg:flex-row">
        <Sidebar title="ВК Аналитик" />
        <MainContent>
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/comments" element={<Comments />} />
            <Route path="/keywords" element={<Keywords />} />
          </Routes>
        </SidebarInset>
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
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App
