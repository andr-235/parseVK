import { useState, useCallback, useMemo, useRef, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, KeyRound, RefreshCw, Plus, Check, X, Edit3 } from 'lucide-react'
import { Button, Input, Select, Checkbox, ConfirmAction } from '../../components/ui'
import { PageShell } from '../../components/layout/PageShell'
import { TableHead } from '../../components/widgets/table/TableHead'
import type { Column } from '../../components/widgets/table/constants'
import { useDebounce } from '../../shared/hooks/useDebounce'
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
const ROLE_FILTER_OPTIONS = ['Все', 'admin', 'user'] as const

const columns: Column[] = [
  { key: 'username', label: 'Логин', sortable: true },
  { key: 'role', label: 'Роль', className: 'w-28', sortable: true, hide: 'hidden sm:table-cell' },
  { key: 'isActive', label: 'Статус', className: 'w-28', sortable: true },
  { key: 'isTemporaryPassword', label: 'Пароль', className: 'w-28', sortable: true, hide: 'hidden sm:table-cell' },
  { key: 'createdAt', label: 'Создан', className: 'w-28', sortable: true, hide: 'hidden md:table-cell' },
  { key: 'actions', label: 'Действия', sortable: false },
]

type CreateState = {
  username: string
  password: string
  role: string
}

const initialCreate: CreateState = { username: '', password: '', role: 'user' }

const CreateRow = memo(function CreateRow({
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
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-muted hover:bg-bg-hover transition-colors duration-150 border-b border-border"
      >
        <Plus size={14} />
        Создать пользователя...
      </button>
    )
  }

  return (
    <div className="border-b border-border bg-bg-hover/30">
      <div className="flex items-end gap-3 px-3 py-2">
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
})

const UserRow = memo(function UserRow({
  user,
  onPasswordSet,
  isEditing,
  canEdit,
  onEditToggle,
  onEditSaved,
}: {
  user: AdminUser
  onPasswordSet: (pw: string) => void
  isEditing: boolean
  canEdit: boolean
  onEditToggle: () => void
  onEditSaved?: () => void
}) {
  const queryClient = useQueryClient()
  const [confirmingAction, setConfirmingAction] = useState<'delete' | 'tempPw' | 'reset' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setConfirmingAction(null)
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const tempPwMutation = useMutation({
    mutationFn: () => setTemporaryPassword(user.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setConfirmingAction(null)
      onPasswordSet(data.temporaryPassword)
    },
    onError: (err: Error) => { setActionError(err.message); setConfirmingAction(null) },
  })

  const resetPwMutation = useMutation({
    mutationFn: () => resetPassword(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setConfirmingAction(null)
    },
    onError: (err: Error) => { setActionError(err.message); setConfirmingAction(null) },
  })

  const handleEditToggle = useCallback(() => {
    setActionError(null)
    onEditToggle()
  }, [onEditToggle])

  const handleEditSaved = useCallback(() => {
    setActionError(null)
    onEditToggle()
    onEditSaved?.()
  }, [onEditToggle, onEditSaved])

  if (isEditing) {
    return <EditRow user={user} onSaved={handleEditSaved} onCancel={handleEditToggle} />
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-bg-hover transition-colors duration-150">
      <td className="px-3 py-2 text-sm text-text-primary">{user.username}</td>
      <td className="px-3 py-2">
        <span className={`inline-block rounded-sm px-1.5 py-0.5 text-xs font-medium uppercase tracking-wider ${
          user.role === 'admin'
            ? 'bg-accent-soft text-accent'
            : 'bg-bg-hover text-text-secondary'
        }`}>
          {user.role === 'admin' ? 'Админ' : 'Пользователь'}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
          user.isActive ? 'text-success' : 'text-danger'
        }`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-success' : 'bg-danger'}`} />
          {user.isActive ? 'Активен' : 'Неактивен'}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
          user.isTemporaryPassword ? 'text-warning' : 'text-success'
        }`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${user.isTemporaryPassword ? 'bg-warning' : 'bg-success'}`} />
          {user.isTemporaryPassword ? 'Врем. пароль' : 'Постоянный'}
        </span>
      </td>
      <td className="px-3 py-2 text-sm text-text-secondary">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}</td>
      <td className="px-3 py-2">
        {confirmingAction === 'delete' ? (
          <ConfirmAction
            onConfirm={() => deleteMutation.mutate()}
            onCancel={() => { setConfirmingAction(null); setActionError(null) }}
            isLoading={deleteMutation.isPending}
            showIcon
            loadingLabel="Удаление..."
          />
        ) : confirmingAction === 'tempPw' ? (
          <ConfirmAction
            onConfirm={() => tempPwMutation.mutate()}
            onCancel={() => { setConfirmingAction(null); setActionError(null) }}
            isLoading={tempPwMutation.isPending}
            message="Показать временный пароль?"
            confirmLabel="Показать"
            loadingLabel="Генерация..."
            showIcon
          />
        ) : confirmingAction === 'reset' ? (
          <ConfirmAction
            onConfirm={() => resetPwMutation.mutate()}
            onCancel={() => { setConfirmingAction(null); setActionError(null) }}
            isLoading={resetPwMutation.isPending}
            message="Пароль будет сброшен. Пользователь не сможет войти."
            confirmLabel="Сбросить"
            loadingLabel="Сброс..."
            showIcon
          />
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="xs" semantic="default"
              onClick={handleEditToggle}
              disabled={!canEdit}
              aria-label={`Редактировать ${user.username}`}
              icon={<Edit3 size={13} />}
              className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
            >
              Ред.
            </Button>
            <Button
              variant="ghost" size="xs" semantic="default"
              onClick={() => setConfirmingAction('tempPw')}
              disabled={tempPwMutation.isPending}
              aria-label={`Установить временный пароль для ${user.username}`}
              icon={<KeyRound size={13} />}
              className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
            >
              {tempPwMutation.isPending ? '...' : 'Врем. пароль'}
            </Button>
            <Button
              variant="ghost" size="xs" semantic="default"
              onClick={() => setConfirmingAction('reset')}
              disabled={resetPwMutation.isPending}
              aria-label={`Сбросить пароль для ${user.username}`}
              icon={<RefreshCw size={13} />}
              className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
            >
              {resetPwMutation.isPending ? '...' : 'Сброс'}
            </Button>
            <Button
              variant="ghost" size="xs" semantic="danger"
              onClick={() => setConfirmingAction('delete')}
              aria-label={`Удалить ${user.username}`}
              icon={<Trash2 size={13} />}
              className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
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
})

const EditRow = memo(function EditRow({
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
      <td colSpan={6} className="px-3 py-2">
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
})

function TempPasswordBanner({ password, onClose }: { password: string; onClose: () => void }) {
  const [confirmingDismiss, setConfirmingDismiss] = useState(false)

  if (confirmingDismiss) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-md border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning" role="alert">
        <KeyRound size={16} />
        <span>Пароль скопирован? После закрытия показать его снова будет нельзя.</span>
        <Button variant="secondary" size="xs" semantic="warning" onClick={onClose}>Закрыть</Button>
        <Button variant="secondary" size="xs" onClick={() => setConfirmingDismiss(false)}>Отмена</Button>
      </div>
    )
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-md border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning" role="status">
      <KeyRound size={16} />
      <span>Временный пароль: <strong className="font-mono">{password}</strong></span>
      <button onClick={() => setConfirmingDismiss(true)} className="ml-auto rounded-sm p-1 hover:opacity-80 transition-opacity duration-150" aria-label="Скрыть">
        <X size={14} />
      </button>
    </div>
  )
}

type SortKey = 'username' | 'role' | 'isActive' | 'isTemporaryPassword' | 'createdAt'
type SortDir = 'asc' | 'desc'
type SortConfig = { key: SortKey; dir: SortDir }

export function AdminUsersPage() {
  const [createExpanded, setCreateExpanded] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Все')
  const [sort, setSort] = useState<SortConfig>({ key: 'createdAt', dir: 'desc' })
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(search, 300)

  const { data: users, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-users', { search: debouncedSearch }],
    queryFn: () => fetchAdminUsers(),
  })

  const filtered = useMemo(() => {
    if (!users) return []
    let items = [...users]
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      items = items.filter((u) => u.username.toLowerCase().includes(q))
    }
    if (roleFilter !== 'Все') items = items.filter((u) => u.role === roleFilter)
    return [...items].sort((a, b) => {
      const av = String(a[sort.key] ?? '')
      const bv = String(b[sort.key] ?? '')
      const cmp = av.localeCompare(bv, 'ru')
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [users, debouncedSearch, roleFilter, sort])

  const handleSort = useCallback((key: string) => {
    setSort((prev) => prev.key === key ? { key: key as SortKey, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key: key as SortKey, dir: 'asc' })
  }, [])

  const resetFilters = useCallback(() => { setSearch(''); setRoleFilter('Все') }, [])

  const handleToggleCreate = useCallback(() => {
    setCreateExpanded((prev) => !prev)
    setEditingId(null)
  }, [])

  const handleCreated = useCallback(() => {
    setCreateExpanded(false)
    setSuccessMsg('Пользователь создан')
    tableRef.current?.focus()
    setTimeout(() => setSuccessMsg(null), 3000)
  }, [])

  const handlePasswordSet = useCallback((pw: string) => {
    setTempPassword(pw)
  }, [])

  const handleEditToggleFor = useCallback((userId: string) => {
    setEditingId((prev) => prev === userId ? null : userId)
    setCreateExpanded(false)
  }, [])

  const handleEditSaved = useCallback(() => {
    setSuccessMsg('Изменения сохранены')
    tableRef.current?.focus()
    setTimeout(() => setSuccessMsg(null), 3000)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') e.preventDefault()
  }, [])

  return (
    <PageShell title="Админ-панель">

      {tempPassword && (
        <TempPasswordBanner password={tempPassword} onClose={() => setTempPassword(null)} />
      )}

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-success/30 bg-success-soft px-3 py-2 text-xs text-success" role="status">
          {successMsg}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск пользователей..."
          aria-label="Поиск пользователей"
        />
        <Select value={roleFilter} options={ROLE_FILTER_OPTIONS} onChange={(v) => setRoleFilter(v)} label="Фильтр по роли" />
        <Button variant="secondary" size="xs" onClick={resetFilters} aria-label="Сбросить все фильтры" icon={<X size={12} />}>
          Сбросить
        </Button>
      </div>

      <div
        ref={tableRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="min-w-0 overflow-x-auto rounded-lg border border-border bg-bg-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        role="table"
        aria-label="Таблица пользователей"
      >
        <CreateRow
          expanded={createExpanded}
          onToggle={handleToggleCreate}
          onCreated={handleCreated}
        />
        <table className="w-full text-sm">
          <TableHead columns={columns} sort={sort} onSort={handleSort} />
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-4">
                  <div className="animate-pulse space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        {Array.from({ length: columns.length }).map((__, j) => (
                          <div key={j} className="h-4 flex-1 rounded bg-bg-hover" />
                        ))}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-sm text-danger">
                    <p>{error instanceof Error ? error.message : 'Произошла ошибка'}</p>
                    <Button variant="secondary" size="xs" onClick={() => refetch()}>
                      Повторить
                    </Button>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center text-sm text-text-muted">
                  {search || roleFilter !== 'Все' ? 'Ничего не найдено' : 'Нет пользователей'}
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onPasswordSet={handlePasswordSet}
                  isEditing={editingId === user.id}
                  canEdit={!editingId || editingId === user.id}
                  onEditToggle={() => handleEditToggleFor(user.id)}
                  onEditSaved={handleEditSaved}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}
