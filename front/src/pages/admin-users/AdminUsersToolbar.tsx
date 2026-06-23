import { X } from 'lucide-react'
import { Button, Input, Select } from '../../components/ui'
import type { ActiveFilter, PasswordFilter, RoleFilter } from './useAdminUsers'

type Props = {
  search: string
  role: RoleFilter
  active: ActiveFilter
  password: PasswordFilter
  onSearch: (value: string) => void
  onRole: (value: RoleFilter) => void
  onActive: (value: ActiveFilter) => void
  onPassword: (value: PasswordFilter) => void
  onReset: () => void
}

export function AdminUsersToolbar(props: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Input
        type="search"
        value={props.search}
        onChange={(event) => props.onSearch(event.target.value)}
        placeholder="Поиск пользователей..."
        aria-label="Поиск пользователей"
      />
      <Select value={props.role} options={['all', 'admin', 'user']} onChange={props.onRole} label="Фильтр по роли" optionLabels={{ all: 'Все роли', admin: 'Админ', user: 'Пользователь' }} />
      <Select value={props.active} options={['all', 'active', 'inactive']} onChange={props.onActive} label="Фильтр по статусу" optionLabels={{ all: 'Все статусы', active: 'Активен', inactive: 'Неактивен' }} />
      <Select value={props.password} options={['all', 'temporary', 'permanent']} onChange={props.onPassword} label="Фильтр по паролю" optionLabels={{ all: 'Все пароли', temporary: 'Временный', permanent: 'Постоянный' }} />
      <Button variant="secondary" size="xs" onClick={props.onReset} icon={<X size={12} />}>
        Сбросить
      </Button>
    </div>
  )
}
