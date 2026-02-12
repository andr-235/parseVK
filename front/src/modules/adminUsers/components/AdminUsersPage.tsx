import { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyRound, RefreshCw, Trash2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/shared/ui/empty'
import { LoadingState } from '@/shared/components/LoadingState'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { cn } from '@/shared/utils'
import { adminUsersService } from '@/modules/adminUsers/api/adminUsers.api'
import { useCurrentUser } from '@/modules/adminUsers/hooks/useCurrentUser'
import { AdminUsersHero } from '@/modules/adminUsers/components/AdminUsersHero'
import type { AdminUser, UserRole } from '@/modules/auth'

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

  const handleDeleteUser = async (userId: number) => {
    if (currentUser?.id === userId) {
      setSubmitError('Нельзя удалить текущего пользователя')
      return
    }

    const confirmed = window.confirm('Удалить пользователя? Это действие необратимо.')
    if (!confirmed) {
      return
    }

    setDeletingId(userId)
    setSubmitError(null)
    try {
      await adminUsersService.deleteUser(userId)
      setUsers((prev) => prev.filter((user) => user.id !== userId))
    } catch {
      setSubmitError('Не удалось удалить пользователя')
    } finally {
      setDeletingId(null)
    }
  }

  const showTemporaryPassword = async (user: AdminUser, temporaryPassword: string) => {
    try {
      await navigator.clipboard.writeText(temporaryPassword)
      toast.success('Временный пароль скопирован')
    } catch {
      toast('Скопируйте временный пароль вручную')
    }

    window.prompt(`Временный пароль для ${user.username}`, temporaryPassword)
  }

  const handleTemporaryPassword = async (user: AdminUser, mode: 'set' | 'reset') => {
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
  }

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      {/* Hero Section - fade in first */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <AdminUsersHero totalUsers={users.length} onRefresh={loadUsers} isLoading={isLoading} />
      </div>

      {/* Main Content - staggered animation */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr] animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        {/* Create User Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="font-monitoring-display text-2xl font-semibold text-white">
              Новый пользователь
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          </div>

          <Card className="border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-6 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <p className="text-sm text-slate-400 mb-6">Добавьте логин, пароль и назначьте роль.</p>
            <form className="space-y-5" onSubmit={handleCreateUser}>
              <div className="space-y-2">
                <Label
                  htmlFor="new-username"
                  className="text-xs font-medium uppercase tracking-wider text-slate-400"
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
                  className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-xs font-medium uppercase tracking-wider text-slate-400"
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
                  className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
                />
                <p className="text-xs text-slate-500">
                  Минимум 8 символов, заглавные и строчные буквы, цифры.
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="new-role"
                  className="text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  Роль
                </Label>
                <select
                  id="new-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className={cn(
                    'h-11 w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white transition-all duration-200',
                    'focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20'
                  )}
                  disabled={isSubmitting}
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              {formError && <div className="text-sm text-red-400">{formError}</div>}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300"
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
            <h2 className="font-monitoring-display text-2xl font-semibold text-white">
              Список пользователей
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          </div>

          <Card className="border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-6 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <p className="text-sm text-slate-400 mb-6">Все зарегистрированные аккаунты.</p>
            {isLoading ? (
              <LoadingState message="Загрузка пользователей..." />
            ) : sortedUsers.length === 0 ? (
              <Empty className="border border-dashed border-border/50 bg-background-secondary/60">
                <EmptyHeader>
                  <EmptyTitle>Пользователей нет</EmptyTitle>
                  <EmptyDescription>Создайте первого пользователя администратора.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Логин</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => {
                    const isCurrent = currentUser?.id === user.id
                    const isTemporarilyBlocked = Boolean(user.isTemporaryPassword)
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-text-primary">
                          {user.username}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'highlight' : 'secondary'}>
                            {roleLabelMap[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isTemporarilyBlocked ? (
                            <Badge variant="outline">Нужна смена пароля</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Активен</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={passwordActionId === user.id}
                              onClick={() => handleTemporaryPassword(user, 'set')}
                              title="Выдать временный пароль"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={passwordActionId === user.id}
                              onClick={() => handleTemporaryPassword(user, 'reset')}
                              title="Сбросить пароль"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === user.id || isCurrent}
                              onClick={() => handleDeleteUser(user.id)}
                              title={isCurrent ? 'Нельзя удалить себя' : 'Удалить пользователя'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
            {submitError && <div className="mt-4 text-sm text-red-400">{submitError}</div>}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminUsersPage
