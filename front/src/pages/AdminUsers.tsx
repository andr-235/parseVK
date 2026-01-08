import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { LoadingState } from '@/components/LoadingState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { adminUsersService } from '@/services/adminUsersService'
import { useAuthStore } from '@/store'
import type { AdminUser, UserRole } from '@/types/auth'

const roleLabelMap: Record<UserRole, string> = {
  admin: 'Администратор',
  user: 'Пользователь',
}

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

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.username.localeCompare(b.username))
  }, [users])

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setSubmitError(null)
    try {
      const data = await adminUsersService.listUsers()
      setUsers(data)
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      setSubmitError('Не удалось удалить пользователя')
    } finally {
      setDeletingId(null)
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Роль</Label>
              <select
                id="new-role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className={cn(
                  'border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs',
                  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  'dark:bg-[#141414] dark:text-text-primary'
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
            <Empty className="border border-dashed border-border/70 bg-background-primary/40">
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
                  <TableHead>Создан</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id
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
                      <TableCell>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === user.id || isCurrent}
                          onClick={() => handleDeleteUser(user.id)}
                          title={isCurrent ? 'Нельзя удалить себя' : 'Удалить пользователя'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
