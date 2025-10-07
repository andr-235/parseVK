import '../App.css'
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
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>{title}</h2>
        <ThemeToggle />
      </div>
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => isActive ? 'active' : ''}
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
