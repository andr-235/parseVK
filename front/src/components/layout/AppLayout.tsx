import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-bg-elevated focus:px-4 focus:py-2 focus:text-sm focus:text-accent focus:border focus:border-border"
      >
        Перейти к содержанию
      </a>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-40 md:relative md:z-auto ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main id="main-content" className="flex-1 overflow-y-auto p-6" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
