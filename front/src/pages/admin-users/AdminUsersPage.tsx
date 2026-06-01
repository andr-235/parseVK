import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, KeyRound, RefreshCw, Plus, Check, X, AlertTriangle, ShieldAlert, Edit3 } from 'lucide-react'
import { Button, Input, Select, Checkbox, TableSkeleton } from '../../components/ui'
import { ApiError } from '../../shared/api/client'
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  setTemporaryPassword,
  resetPassword,
  type AdminUser,
} from '../../shared/api/admin-users'

const ROLE_OPTIONS = ['user', 'admin'] as const

type CreateState = {
  username: string
  password: string
  role: string
}

const initialCreate: CreateState = { username: '', password: '', role: 'user' }

function formatError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'Доступ запрещён. Только администраторы могут управлять пользователями.'
    if (err.status === 401) return 'Сессия истекла. Войдите заново.'
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Ошибка загрузки'
}

function CreateRow({
  expanded,
  onToggle,
  onCreated,
}: {
  expanded: boolean
  onToggle: () => void
  onCreated: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreateState>(initialCreate)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createAdminUser(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setForm(initialCreate)
      setError(null)
      onCreated()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = useCallback(() => {
    if (!form.username.trim() || !form.password.trim()) {
      setError('Заполните логин и пароль')
      return
    }
    setError(null)
    mutation.mutate()
  }, [form, mutation])

  const handleCancel = useCallback(() => {
    setForm(initialCreate)
    setError(null)
    onToggle()
  }, [onToggle])

  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text-muted hover:bg-bg-hover transition-colors duration-150 border-b border-border"
      >
        <Plus size={14} />
        Создать пользователя...
      </button>
    )
  }

  return (
    <div className="border-b border-border bg-bg-hover/30">
      <div className="flex items-end gap-3 px-3 py-2.5">
        <div className="flex-1">
          <label htmlFor="create-username" className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
            Логин
          </label>
          <Input
            id="create-username"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="username"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="create-password" className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
            Пароль
          </label>
          <Input
            id="create-password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="••••••••"
          />
        </div>
        <div className="w-32">
          <label htmlFor="create-role" className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
            Роль
          </label>
          <Select
            value={form.role}
            options={ROLE_OPTIONS}
            onChange={(v) => setForm((prev) => ({ ...prev, role: v }))}
            label="Роль"
          />
        </div>
        <div className="flex items-center gap-1 pb-0.5">
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={mutation.isPending} aria-label="Создать пользователя" icon={<Check size={14} />}>
            {mutation.isPending ? 'Сохранение...' : 'Создать'}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCancel} aria-label="Отменить" icon={<X size={14} />}>
            Отмена
          </Button>
        </div>
      </div>
      {error && (
        <p className="px-3 pb-2 text-xs text-danger" role="alert">{error}</p>
      )}
    </div>
  )
}

function UserRow({
  user,
  onPasswordSet,
  isEditing,
  canEdit,
  onEditToggle,
}: {
  user: AdminUser
  onPasswordSet: (pw: string) => void
  isEditing: boolean
  canEdit: boolean
  onEditToggle: () => void
}) {
  const queryClient = useQueryClient()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setConfirmingDelete(false)
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const tempPwMutation = useMutation({
    mutationFn: () => setTemporaryPassword(user.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onPasswordSet(data.temporaryPassword)
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const resetPwMutation = useMutation({
    mutationFn: () => resetPassword(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const handleEditToggle = useCallback(() => {
    setActionError(null)
    onEditToggle()
  }, [onEditToggle])

  if (isEditing) {
    return <EditRow user={user} onSaved={handleEditToggle} onCancel={handleEditToggle} />
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-bg-hover transition-colors duration-150">
      <td className="px-3 py-2.5 text-sm text-text-primary">{user.username}</td>
      <td className="px-3 py-2.5">
        <span className={`inline-block rounded-sm px-1.5 py-0.5 text-xs font-medium uppercase tracking-wider ${
          user.role === 'admin'
            ? 'bg-accent-soft text-accent'
            : 'bg-bg-hover text-text-secondary'
        }`}>
          {user.role === 'admin' ? 'Админ' : 'Пользователь'}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
          user.isActive ? 'text-success' : 'text-danger'
        }`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-success' : 'bg-danger'}`} />
          {user.isActive ? 'Активен' : 'Неактивен'}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
          user.isTemporaryPassword ? 'text-warning' : 'text-success'
        }`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${user.isTemporaryPassword ? 'bg-warning' : 'bg-success'}`} />
          {user.isTemporaryPassword ? 'Врем. пароль' : 'ОК'}
        </span>
      </td>
      <td className="px-3 py-2.5 text-sm text-text-secondary">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}</td>
      <td className="px-3 py-2.5">
        {confirmingDelete ? (
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle size={12} className="text-danger" />
            <span className="text-text-secondary">Удалить?</span>
            <Button variant="primary" size="xs" semantic="danger" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Удаление...' : 'Да'}
            </Button>
            <Button variant="secondary" size="xs" onClick={() => { setConfirmingDelete(false); setActionError(null) }} disabled={deleteMutation.isPending}>
              Отмена
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="xs" semantic="default"
              onClick={handleEditToggle}
              disabled={!canEdit}
              aria-label={`Редактировать ${user.username}`}
              icon={<Edit3 size={13} />}
            />
            <Button
              variant="ghost" size="xs" semantic="default"
              onClick={() => tempPwMutation.mutate()}
              disabled={tempPwMutation.isPending}
              aria-label={`Установить временный пароль для ${user.username}`}
              icon={<KeyRound size={13} />}
            >
              {tempPwMutation.isPending ? '...' : 'Врем. пароль'}
            </Button>
            <Button
              variant="ghost" size="xs" semantic="default"
              onClick={() => resetPwMutation.mutate()}
              disabled={resetPwMutation.isPending}
              aria-label={`Сбросить пароль для ${user.username}`}
              icon={<RefreshCw size={13} />}
            >
              {resetPwMutation.isPending ? '...' : 'Сброс'}
            </Button>
            <Button
              variant="ghost" size="xs" semantic="danger"
              onClick={() => setConfirmingDelete(true)}
              aria-label={`Удалить ${user.username}`}
              icon={<Trash2 size={13} />}
            >
              Удалить
            </Button>
          </div>
        )}
        {actionError && (
          <p className="mt-1 text-xs text-danger" role="alert">{actionError}</p>
        )}
      </td>
    </tr>
  )
}

function EditRow({
  user,
  onSaved,
  onCancel,
}: {
  user: AdminUser
  onSaved: () => void
  onCancel: () => void
}) {
  const queryClient = useQueryClient()
  const [isActive, setIsActive] = useState(user.isActive)
  const [role, setRole] = useState(user.role)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => updateAdminUser(user.id, { isActive, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onSaved()
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <tr className="border-b border-border bg-bg-hover/30">
      <td colSpan={6} className="px-3 py-2.5">
        <div className="flex items-end gap-3">
          <div>
            <label htmlFor={`edit-active-${user.id}`} className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Статус
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-main px-3 py-2 text-sm select-none">
              <Checkbox
                id={`edit-active-${user.id}`}
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className={isActive ? 'text-success' : 'text-danger'}>
                {isActive ? 'Активен' : 'Неактивен'}
              </span>
            </label>
          </div>
          <div>
            <label htmlFor={`edit-role-${user.id}`} className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Роль
            </label>
            <Select
              id={`edit-role-${user.id}`}
              value={role}
              options={ROLE_OPTIONS}
              onChange={(v) => setRole(v)}
              label="Роль"
            />
          </div>
          <div className="flex items-center gap-1 pb-0.5">
            <Button variant="primary" size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending} aria-label="Сохранить изменения" icon={<Check size={14} />}>
              {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button variant="secondary" size="sm" onClick={onCancel} disabled={mutation.isPending} aria-label="Отменить редактирование" icon={<X size={14} />}>
              Отмена
            </Button>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-xs text-danger" role="alert">{error}</p>
        )}
      </td>
    </tr>
  )
}

function TempPasswordBanner({ password, onClose }: { password: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm text-success" role="status">
      <KeyRound size={16} />
      <span>Временный пароль: <strong className="font-mono">{password}</strong></span>
      <button onClick={onClose} className="ml-auto rounded-sm p-1 hover:opacity-80 transition-opacity duration-150" aria-label="Закрыть">
        <X size={14} />
      </button>
    </div>
  )
}

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [createExpanded, setCreateExpanded] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
  })

  return (
    <div className="flex flex-1 flex-col p-6">
      <h1 className="mb-6 text-lg font-semibold text-text-primary">Админ-панель</h1>

      {tempPassword && (
        <TempPasswordBanner password={tempPassword} onClose={() => setTempPassword(null)} />
      )}

      <div className="min-w-0 overflow-x-auto rounded-lg border border-border bg-bg-main">
        <CreateRow
          expanded={createExpanded}
          onToggle={() => {
            setCreateExpanded((prev) => !prev)
            setEditingId(null)
          }}
          onCreated={() => setCreateExpanded(false)}
        />

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-sidebar text-left text-xs font-medium uppercase tracking-wider text-text-muted">
              <th className="px-3 py-2">Логин</th>
              <th className="px-3 py-2 w-28">Роль</th>
              <th className="px-3 py-2 w-28">Статус</th>
              <th className="px-3 py-2 w-28">Пароль</th>
              <th className="px-3 py-2 w-28">Создан</th>
              <th className="px-3 py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-3 py-4">
                  <TableSkeleton rows={4} cols={6} />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ShieldAlert size={24} className="text-danger" />
                    <p className="text-sm text-danger">{formatError(error)}</p>
                    <Button variant="secondary" size="sm" onClick={() => queryClient.refetchQueries({ queryKey: ['admin-users'] })}>
                      Попробовать снова
                    </Button>
                  </div>
                </td>
              </tr>
            ) : users && users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-text-muted">Нет пользователей</td>
              </tr>
            ) : (
              users?.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onPasswordSet={(pw) => setTempPassword(pw)}
                  isEditing={editingId === user.id}
                  canEdit={!editingId || editingId === user.id}
                  onEditToggle={() => {
                    setEditingId((prev) => prev === user.id ? null : user.id)
                    setCreateExpanded(false)
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
