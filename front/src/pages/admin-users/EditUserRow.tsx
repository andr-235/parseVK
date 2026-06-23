import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { Button, Checkbox, Select } from '../../components/ui'
import { updateAdminUser, type AdminUser, type UserRole } from '../../shared/api/admin-users'
import { ROLE_OPTIONS } from './adminUsersColumns'
import { adminUsersError } from './adminUsersError'

type Props = { user: AdminUser; onSaved: () => void; onCancel: () => void }

export function EditUserRow({ user, onSaved, onCancel }: Props) {
  const queryClient = useQueryClient()
  const [isActive, setIsActive] = useState(user.isActive)
  const [role, setRole] = useState<UserRole>(user.role)
  const mutation = useMutation({
    mutationFn: () => updateAdminUser(user.id, { isActive, role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onSaved()
    },
  })

  return (
    <tr className="border-b border-border bg-bg-hover/30">
      <td colSpan={6} className="px-3 py-2">
        <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); mutation.mutate() }}>
          <label className="flex items-center gap-2 rounded-md border border-border bg-bg-main px-3 py-2 text-sm">
            <Checkbox checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            {isActive ? 'Активен' : 'Неактивен'}
          </label>
          <Select value={role} options={ROLE_OPTIONS} onChange={setRole} label="Роль" optionLabels={{ user: 'Пользователь', admin: 'Админ' }} />
          <Button type="submit" variant="primary" size="sm" disabled={mutation.isPending} icon={<Check size={14} />}>Сохранить</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={mutation.isPending} icon={<X size={14} />}>Отмена</Button>
        </form>
        {mutation.error && <p className="mt-2 text-xs text-danger" role="alert">{adminUsersError(mutation.error)}</p>}
      </td>
    </tr>
  )
}
