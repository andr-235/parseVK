import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit3, KeyRound, RefreshCw, Trash2 } from 'lucide-react'
import { Button, ConfirmAction } from '../../components/ui'
import { deleteAdminUser, resetPassword, setTemporaryPassword, type AdminUser } from '../../shared/api/admin-users'
import { EditUserRow } from './EditUserRow'
import { adminUsersError } from './adminUsersError'

type Action = 'delete' | 'temporary' | 'reset'
type Props = {
  user: AdminUser
  editing: boolean
  canEdit: boolean
  onEdit: () => void
  onSaved: () => void
  onPassword: (password: string) => void
}

export function UserRow({ user, editing, canEdit, onEdit, onSaved, onPassword }: Props) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState<Action | null>(null)
  const mutation = useMutation({
    mutationFn: async () => {
      if (action === 'delete') return deleteAdminUser(user.id)
      return action === 'reset' ? resetPassword(user.id) : setTemporaryPassword(user.id)
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      if (result && 'temporaryPassword' in result) onPassword(result.temporaryPassword)
      setAction(null)
    },
  })

  if (editing) return <EditUserRow user={user} onSaved={onSaved} onCancel={onEdit} />
  return (
    <tr className="border-b border-border last:border-0 hover:bg-bg-hover">
      <td className="px-3 py-2 text-sm text-text-primary">{user.username}</td>
      <td className="hidden px-3 py-2 sm:table-cell">{user.role === 'admin' ? 'Админ' : 'Пользователь'}</td>
      <td className="px-3 py-2 text-xs">{user.isActive ? 'Активен' : 'Неактивен'}</td>
      <td className="hidden px-3 py-2 text-xs sm:table-cell">{user.isTemporaryPassword ? 'Врем. пароль' : 'Постоянный'}</td>
      <td className="hidden px-3 py-2 text-sm text-text-secondary md:table-cell">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
      <td className="px-3 py-2">
        {action ? (
          <ConfirmAction
            onConfirm={() => mutation.mutate()}
            onCancel={() => setAction(null)}
            isLoading={mutation.isPending}
            message={action === 'delete' ? 'Удалить?' : action === 'reset' ? 'Сбросить пароль?' : 'Создать временный пароль?'}
            confirmLabel="Да"
            showIcon
          />
        ) : (
          <div className="flex flex-wrap gap-1">
            <Button aria-label={`Редактировать ${user.username}`} variant="ghost" size="xs" onClick={onEdit} disabled={!canEdit} icon={<Edit3 size={13} />}>Ред.</Button>
            <Button aria-label={`Установить временный пароль для ${user.username}`} variant="ghost" size="xs" onClick={() => setAction('temporary')} icon={<KeyRound size={13} />}>Врем. пароль</Button>
            <Button aria-label={`Сбросить пароль для ${user.username}`} variant="ghost" size="xs" onClick={() => setAction('reset')} icon={<RefreshCw size={13} />}>Сброс</Button>
            <Button aria-label={`Удалить ${user.username}`} variant="ghost" size="xs" semantic="danger" onClick={() => setAction('delete')} icon={<Trash2 size={13} />}>Удалить</Button>
          </div>
        )}
        {mutation.error && <p className="mt-1 text-xs text-danger" role="alert">{adminUsersError(mutation.error)}</p>}
      </td>
    </tr>
  )
}
