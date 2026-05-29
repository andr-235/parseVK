import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { adminUsersService } from '@/pages/admin-users/api/adminUsers.api'
import { useCurrentUser } from '@/pages/admin-users/hooks/useCurrentUser'
import { PageContainer } from '@/components/common'
import { Shield, UserPlus, Users, Key, KeyRound, RefreshCw, Trash2 } from 'lucide-react'
import type { AdminUser, UserRole } from '@/types/auth'
import type { TableColumn } from '@/types'
import { DataTable } from '@/components/common/DataTable'
import { cn } from '@/utils/common'

const roleLabelMap: Record<UserRole, string> = {
  admin: 'Администратор',
  user: 'Пользователь',
}
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

function AdminUsersPage() {
  const currentUser = useCurrentUser()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [passwordActionId, setPasswordActionId] = useState<number | null>(null)

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.username.localeCompare(b.username))
  }, [users])

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setSubmitError(null)
    try {
      const data = await adminUsersService.listUsers()
      setUsers(data)
    } catch {
      setSubmitError('Не удалось загрузить пользователей')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setSubmitError(null)

    const trimmedUsername = username.trim()
    if (trimmedUsername.length < 3) {
      setFormError('Логин должен содержать минимум 3 символа')
      return
    }
    if (password.length < 8) {
      setFormError('Пароль должен содержать минимум 8 символов')
      return
    }
    if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
      setFormError('Пароль должен содержать заглавные и строчные буквы, а также цифры')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await adminUsersService.createUser({
        username: trimmedUsername,
        password,
        role,
      })
      setUsers((prev) => [created, ...prev])
      setUsername('')
      setPassword('')
      setRole('user')
    } catch {
      setFormError('Не удалось создать пользователя')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = useCallback(
    async (user: AdminUser) => {
      if (currentUser?.username === user.username) {
        setSubmitError('Нельзя удалить текущего пользователя')
        return
      }

      const confirmed = window.confirm('Удалить пользователя? Это действие необратимо.')
      if (!confirmed) {
        return
      }

      setDeletingId(user.id)
      setSubmitError(null)
      try {
        await adminUsersService.deleteUser(user.id)
        setUsers((prev) => prev.filter((item) => item.id !== user.id))
      } catch {
        setSubmitError('Не удалось удалить пользователя')
      } finally {
        setDeletingId(null)
      }
    },
    [currentUser]
  )

  const showTemporaryPassword = async (user: AdminUser, temporaryPassword: string) => {
    try {
      await navigator.clipboard.writeText(temporaryPassword)
      toast.success('Временный пароль скопирован')
    } catch {
      toast('Скопируйте временный пароль вручную')
    }

    window.prompt(`Временный пароль для ${user.username}`, temporaryPassword)
  }

  const handleTemporaryPassword = useCallback(async (user: AdminUser, mode: 'set' | 'reset') => {
    const confirmed =
      mode === 'reset'
        ? window.confirm(
            'Сбросить пароль и выдать временный? Пользователь будет вынужден сменить его.'
          )
        : window.confirm('Выдать временный пароль пользователю?')

    if (!confirmed) {
      return
    }

    setPasswordActionId(user.id)
    setSubmitError(null)
    try {
      const result =
        mode === 'reset'
          ? await adminUsersService.resetPassword(user.id)
          : await adminUsersService.setTemporaryPassword(user.id)
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, isTemporaryPassword: true } : item))
      )
      await showTemporaryPassword(user, result.temporaryPassword)
    } catch {
      setSubmitError('Не удалось выдать временный пароль')
    } finally {
      setPasswordActionId(null)
    }
  }, [])

  const columns = useMemo<TableColumn<AdminUser>[]>(
    () => [
      {
        header: 'Логин',
        key: 'username',
        cellClassName: 'font-semibold text-text-light',
      },
      {
        header: 'Роль',
        key: 'role',
        render: (user) => (
          <Badge variant={user.role === 'admin' ? 'highlight' : 'secondary'}>
            {roleLabelMap[user.role]}
          </Badge>
        ),
      },
      {
        header: 'Статус',
        key: 'status',
        render: (user) => {
          const isTemporarilyBlocked = Boolean(user.isTemporaryPassword)
          return isTemporarilyBlocked ? (
            <Badge variant="outline" className="border-accent-warning text-accent-warning">
              Нужна смена пароля
            </Badge>
          ) : (
            <span className="text-xs text-text-secondary">Активен</span>
          )
        },
      },
      {
        header: 'Создан',
        key: 'createdAt',
        cellClassName: 'text-text-secondary font-mono-accent',
        render: (user) => new Date(user.createdAt).toLocaleDateString('ru-RU'),
      },
      {
        header: 'Действия',
        key: 'actions',
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        render: (user) => {
          const isCurrent = currentUser?.username === user.username
          return (
            <div
              className="flex items-center justify-end gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={passwordActionId === user.id}
                onClick={() => handleTemporaryPassword(user, 'set')}
                title="Выдать временный пароль"
                className="cursor-pointer"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={passwordActionId === user.id}
                onClick={() => handleTemporaryPassword(user, 'reset')}
                title="Сбросить пароль"
                className="cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={deletingId === user.id || isCurrent}
                onClick={() => handleDeleteUser(user)}
                title={isCurrent ? 'Нельзя удалить себя' : 'Удалить пользователя'}
                className="cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [currentUser, passwordActionId, deletingId, handleTemporaryPassword, handleDeleteUser]
  )

  const pageCards = [
    {
      icon: Users,
      title: 'Пользователей',
      subtitle: '',
      customContent: (
        <div className="space-y-1">
          <p className="text-xs text-text-secondary font-medium uppercase tracking-wide font-mono-accent">
            Пользователей
          </p>
          <p className="font-monitoring-display text-3xl font-bold text-white">{users.length}</p>
        </div>
      ),
    },
    { icon: Shield, title: 'Роли', subtitle: 'Администратор / Пользователь' },
    { icon: UserPlus, title: 'Создание', subtitle: 'Новые учетные записи' },
    { icon: Key, title: 'Безопасность', subtitle: 'Пароли и доступ' },
  ]

  return (
    <PageContainer maxWidth="1600px" animate={false}>
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 rounded-lg border border-border bg-background-secondary">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-text-light">
              Управление <span className="text-accent-primary">пользователями</span>
            </h1>
            <p className="text-sm text-text-secondary">
              Создавайте учетные записи, назначайте роли и контролируйте доступ к системе. Управление временными паролями и безопасностью аккаунтов.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadUsers}
              size="sm"
              variant="outline"
              className="h-10 shrink-0 border-border bg-background-secondary text-text-secondary hover:border-accent-primary/50 hover:text-text-light transition-all duration-200 cursor-pointer"
              disabled={isLoading}
            >
              <RefreshCw className={cn('mr-2 w-4 h-4', isLoading && 'animate-spin')} />
              Обновить
            </Button>
          </div>
        </div>

        {/* Flat Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
          {pageCards.map((card, index) => {
            const Icon = card.icon
            return (
              <div key={index} className="border border-border bg-background-secondary p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{card.title}</h3>
                    <p className="text-xs text-text-secondary">{card.subtitle}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content - staggered animation */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr] animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100 font-monitoring-body">
        {/* Create User Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="font-monitoring-display text-2xl font-semibold text-text-light">
              Новый пользователь
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <Card className="border border-border bg-background-secondary rounded-card p-6 overflow-hidden relative">
            <p className="text-sm text-text-secondary mb-6">
              Добавьте логин, пароль и назначьте роль.
            </p>
            <form className="space-y-5" onSubmit={handleCreateUser}>
              <div className="space-y-2">
                <Label
                  htmlFor="new-username"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-monitoring-body"
                >
                  Логин
                </Label>
                <Input
                  id="new-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="username"
                  disabled={isSubmitting}
                  required
                  className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-monitoring-body"
                >
                  Пароль
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Минимум 8 символов"
                  disabled={isSubmitting}
                  required
                  className="h-10 border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200"
                />
                <p className="text-xs text-text-secondary font-mono-accent">
                  Минимум 8 символов, заглавные и строчные буквы, цифры.
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="new-role"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-monitoring-body"
                >
                  Роль
                </Label>
                <select
                  id="new-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className={cn(
                    'h-10 w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-text-light transition-all duration-200 outline-none',
                    'focus:border-accent-primary/50 focus:ring-2 focus:ring-accent-primary/20'
                  )}
                  disabled={isSubmitting}
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              {formError && (
                <div className="text-sm text-accent-danger font-semibold">{formError}</div>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="default"
                className="w-full h-10 shadow-soft-sm font-semibold hover:shadow-soft-md transition-all duration-200 cursor-pointer"
              >
                {isSubmitting ? 'Создаём...' : 'Создать пользователя'}
                <UserPlus className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Card>
        </div>

        {/* Users List Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="font-monitoring-display text-2xl font-semibold text-text-light">
              Список пользователей
            </h2>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <Card className="border border-border bg-background-secondary rounded-card p-6 overflow-hidden relative">
            <p className="text-sm text-text-secondary mb-6">Все зарегистрированные аккаунты.</p>
            {sortedUsers.length === 0 && !isLoading ? (
              <Empty className="border border-dashed border-border/50 bg-background-secondary/60">
                <EmptyHeader>
                  <EmptyTitle>Пользователей нет</EmptyTitle>
                  <EmptyDescription>Создайте первого пользователя администратора.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <DataTable
                data={sortedUsers}
                columns={columns}
                isLoading={isLoading}
                loadingRowsCount={3}
              />
            )}
            {submitError && (
              <div className="mt-4 text-sm text-accent-danger font-semibold">{submitError}</div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

export default AdminUsersPage
