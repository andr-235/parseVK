import { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyRound, RefreshCw, Trash2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeroCard from '@/shared/components/PageHeroCard'
import { SectionCard } from '@/shared/components'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/shared/ui/empty'
import { LoadingState } from '@/shared/components/LoadingState'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { cn } from '@/lib/utils'
import { adminUsersService } from '@/services/adminUsersService'
import { useAuthStore } from '@/store'
import type { AdminUser, UserRole } from '@/types/auth'

const roleLabelMap: Record<UserRole, string> = {
  admin: 'Администратор',
  user: 'Пользователь',
}
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$/

function AdminUsers() {
  const currentUser = useAuthStore((state) => state.user)
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
    <div className="flex flex-col gap-6 pb-8">
      <PageHeroCard
        title="Управление пользователями"
        description="Создавайте учетные записи и контролируйте доступ к системе."
        actions={
          <Button variant="secondary" onClick={loadUsers} disabled={isLoading}>
            Обновить список
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <SectionCard
          title="Новый пользователь"
          description="Добавьте логин, пароль и назначьте роль."
        >
          <form className="space-y-5" onSubmit={handleCreateUser}>
            <div className="space-y-2">
              <Label htmlFor="new-username">Логин</Label>
              <Input
                id="new-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="username"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Пароль</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Минимум 8 символов"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground">
                Минимум 8 символов, заглавные и строчные буквы, цифры.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Роль</Label>
              <select
                id="new-role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className={cn(
                  'border-border/60 h-10 w-full rounded-xl border bg-background-secondary px-3 py-2 text-sm shadow-soft-sm',
                  'focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-2'
                )}
                disabled={isSubmitting}
              >
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            {formError && <div className="text-sm text-destructive">{formError}</div>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Создаём...' : 'Создать пользователя'}
              <UserPlus className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </SectionCard>

        <SectionCard title="Список пользователей" description="Все зарегистрированные аккаунты.">
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
                      <TableCell>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</TableCell>
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
          {submitError && <div className="mt-4 text-sm text-destructive">{submitError}</div>}
        </SectionCard>
      </div>
    </div>
  )
}

export default AdminUsers
