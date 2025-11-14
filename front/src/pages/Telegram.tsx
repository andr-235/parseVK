import { useMemo, useState } from 'react'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { telegramApi } from '@/api/telegramApi'
import type { TelegramMember, TelegramSyncResponse } from '@/types/api'

const Telegram = () => {
  const [identifier, setIdentifier] = useState('')
  const [limit, setLimit] = useState<string>('1000')
  const [data, setData] = useState<TelegramSyncResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const members = useMemo(() => data?.members ?? [], [data?.members])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!identifier.trim()) {
      setError('Укажите идентификатор чата или username')
      return
    }
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const numericLimit = Number.parseInt(limit, 10)
      const response = await telegramApi.syncChat({
        identifier: identifier.trim(),
        limit: Number.isNaN(numericLimit) ? undefined : numericLimit,
      })
      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить участников')
    } finally {
      setLoading(false)
    }
  }

  const formatMemberName = (member: TelegramMember) => {
    const parts = [member.firstName, member.lastName].filter((value) => Boolean(value && value.trim().length > 0))
    if (parts.length > 0) {
      return parts.join(' ')
    }
    if (member.username) {
      return `@${member.username}`
    }
    return member.telegramId
  }

  const formatDate = (value: string | null) => {
    if (!value) {
      return '—'
    }
    try {
      return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    } catch {
      return value
    }
  }

  const formatStatus = (status: TelegramMember['status']) => {
    const map: Record<TelegramMember['status'], string> = {
      CREATOR: 'Создатель',
      ADMINISTRATOR: 'Администратор',
      MEMBER: 'Участник',
      RESTRICTED: 'Ограничен',
      LEFT: 'Покинул',
      KICKED: 'Исключён',
    }
    return map[status] ?? status
  }

  const statusVariant = (status: TelegramMember['status']) => {
    if (status === 'CREATOR') return 'default'
    if (status === 'ADMINISTRATOR') return 'secondary'
    if (status === 'RESTRICTED') return 'outline'
    if (status === 'LEFT' || status === 'KICKED') return 'destructive'
    return 'outline'
  }

  const summaryItems = useMemo(() => {
    if (!data) {
      return []
    }
    return [
      { label: 'Тип', value: data.type },
      { label: 'Название', value: data.title ?? '—' },
      { label: 'Username', value: data.username ? `@${data.username}` : '—' },
      { label: 'Синхронизировано', value: String(data.syncedMembers) },
      { label: 'Всего участников', value: data.totalMembers != null ? String(data.totalMembers) : '—' },
    ]
  }, [data])

  return (
    <div className="flex flex-col gap-8">
      <PageHeroCard
        title="Синхронизация Telegram"
        description="Введите идентификатор чата, username или ссылку, чтобы загрузить участников и сохранить их в базе данных."
      />

      <SectionCard
        title="Параметры синхронизации"
        description="Укажите целевой канал, чат или группу. Данные будут загружены через MTProto и станут доступны в таблице ниже."
      >
        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[minmax(280px,2fr)_minmax(140px,1fr)_max-content] md:items-end">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-text-secondary" htmlFor="identifier">
              Идентификатор или @username
            </label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Пример: @channel или -1001234567890"
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-text-secondary" htmlFor="limit">
              Ограничение участников
            </label>
            <Input
              id="limit"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              placeholder="1000"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className="md:w-auto">
            {loading ? 'Синхронизация…' : 'Синхронизировать'}
          </Button>
        </form>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {data && (
          <div className="grid gap-3 rounded-xl border border-border/60 bg-background-primary/80 px-4 py-3 text-sm text-text-secondary md:grid-cols-5">
            {summaryItems.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-tertiary">{item.label}</span>
                <span className="text-sm text-text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Участники Telegram"
        description="Список участников синхронизированного чата с индикаторами статуса и ролей."
      >
        {loading && (
          <div className="rounded-lg border border-border/60 bg-background-secondary px-6 py-6 text-center text-sm text-text-secondary">
            Загружаем участников…
          </div>
        )}

        {!loading && data && members.length === 0 && (
          <div className="rounded-lg border border-border/60 bg-background-secondary px-6 py-6 text-center text-sm text-text-secondary">
            Участники не найдены.
          </div>
        )}

        {!loading && members.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Участник</TableHead>
                <TableHead className="w-[140px]">Роль</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead className="w-[180px]">Присоединился</TableHead>
                <TableHead className="w-[180px]">Покинул</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={`${member.userId}-${member.telegramId}`}>
                  <TableCell className="space-y-1">
                    <div className="font-medium text-text-primary">{formatMemberName(member)}</div>
                    <div className="text-xs text-text-secondary">ID: {member.telegramId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(member.status)}>{formatStatus(member.status)}</Badge>
                  </TableCell>
                  <TableCell className="space-y-1">
                    <div className="text-sm text-text-secondary">{member.username ? `@${member.username}` : '—'}</div>
                    <div className="text-sm text-text-secondary">{member.phoneNumber ?? '—'}</div>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDate(member.joinedAt)}</TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDate(member.leftAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  )
}

export default Telegram

