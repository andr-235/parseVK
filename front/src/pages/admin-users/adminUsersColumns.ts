import type { Column } from '../../components/widgets/table/constants'
import type { UserRole } from '../../shared/api/admin-users'

export const ROLE_OPTIONS = ['user', 'admin'] as const satisfies readonly UserRole[]

export const columns: Column[] = [
  { key: 'username', label: 'Логин', sortable: true },
  { key: 'role', label: 'Роль', className: 'w-28', sortable: true, hide: 'hidden sm:table-cell' },
  { key: 'isActive', label: 'Статус', className: 'w-28', sortable: true },
  { key: 'isTemporaryPassword', label: 'Пароль', className: 'w-32', sortable: true, hide: 'hidden sm:table-cell' },
  { key: 'createdAt', label: 'Создан', className: 'w-28', sortable: true, hide: 'hidden md:table-cell' },
]
