import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Plus, X } from 'lucide-react'
import { Button, Input, Select } from '../../components/ui'
import { createAdminUser, type UserRole } from '../../shared/api/admin-users'
import { ROLE_OPTIONS } from './adminUsersColumns'
import { adminUsersError } from './adminUsersError'

type Props = { expanded: boolean; onToggle: () => void; onCreated: () => void }

export function CreateUserRow({ expanded, onToggle, onCreated }: Props) {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const mutation = useMutation({
    mutationFn: () => createAdminUser({ username: username.trim(), password, role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setUsername('')
      setPassword('')
      setRole('user')
      onCreated()
    },
  })

  if (!expanded) {
    return (
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm text-text-muted hover:bg-bg-hover">
        <Plus size={14} /> Создать пользователя...
      </button>
    )
  }

  const invalid = username.trim().length < 3 || password.length < 12
  return (
    <form className="border-b border-border bg-bg-hover/30 p-3" onSubmit={(event) => { event.preventDefault(); mutation.mutate() }}>
      <div className="flex flex-wrap items-end gap-3">
        <Input aria-label="Логин" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username" />
        <Input aria-label="Пароль" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Минимум 12 символов" />
        <Select value={role} options={ROLE_OPTIONS} onChange={setRole} label="Роль" optionLabels={{ user: 'Пользователь', admin: 'Админ' }} />
        <Button type="submit" variant="primary" size="sm" disabled={invalid || mutation.isPending} icon={<Check size={14} />}>Создать</Button>
        <Button type="button" variant="secondary" size="sm" onClick={onToggle} disabled={mutation.isPending} icon={<X size={14} />}>Отмена</Button>
      </div>
      {mutation.error && <p className="mt-2 text-xs text-danger" role="alert">{adminUsersError(mutation.error)}</p>}
    </form>
  )
}
