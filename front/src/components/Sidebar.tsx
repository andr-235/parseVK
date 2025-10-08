import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
  title?: string
}

function Sidebar({ title = 'ВК Аналитик' }: SidebarProps) {
  const menuItems = [
    { label: 'Задачи', path: '/tasks' },
    { label: 'Группы', path: '/groups' },
    { label: 'Комментарии', path: '/comments' },
    { label: 'Ключевые слова', path: '/keywords' }
  ]

  return (
    <aside className="flex h-full w-64 flex-col bg-background-sidebar text-text-light shadow-soft-lg transition-colors duration-300">
      <div className="flex items-center justify-between gap-4 px-6 py-6">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <ThemeToggle />
      </div>
      <nav className="flex-1 overflow-y-auto px-4 pb-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-accent-primary text-white shadow-soft-sm'
                      : 'text-text-light/80 hover:bg-background-sidebar-hover hover:text-text-light'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
