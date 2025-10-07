import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useThemeStore } from './stores'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import Tasks from './pages/Tasks'
import Groups from './pages/Groups'
import Comments from './pages/Comments'
import Keywords from './pages/Keywords'

function App() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode)

  return (
    <BrowserRouter>
      <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
        <Sidebar title="ВК Аналитик" />
        <MainContent>
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/comments" element={<Comments />} />
            <Route path="/keywords" element={<Keywords />} />
          </Routes>
        </MainContent>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}

export default App