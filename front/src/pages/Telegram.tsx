import { useMemo, useState } from 'react'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { telegramApi } from '@/api/telegramApi'
import type {
  TelegramMember,
  TelegramSessionConfirmResponse,
  TelegramSyncResponse,
} from '@/types/api'

const Telegram = () => {
  const [identifier, setIdentifier] = useState('')
  const [limit, setLimit] = useState<string>('1000')
  const [data, setData] = useState<TelegramSyncResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [authPhone, setAuthPhone] = useState('+7')
  const [authApiId, setAuthApiId] = useState('')
  const [authApiHash, setAuthApiHash] = useState('')
  const [authTransactionId, setAuthTransactionId] = useState<string | null>(null)
  const [authStep, setAuthStep] = useState<'phone' | 'code' | 'success'>('phone')
  const [authCode, setAuthCode] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authCodeLength, setAuthCodeLength] = useState(5)
  const [authNextType, setAuthNextType] = useState<'app' | 'sms' | 'call' | 'flash'>('sms')
  const [authTimeoutSec, setAuthTimeoutSec] = useState<number | null>(null)
  const [authResult, setAuthResult] = useState<TelegramSessionConfirmResponse | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const members = useMemo(() => data?.members ?? [], [data?.members])

  const authHint = useMemo(() => {
    switch (authNextType) {
      case 'app':
        return 'Откройте приложение Telegram: код отправлен в личные сообщения с официальным ботом.'
      case 'call':
        return 'Ожидайте входящий звонок — последние цифры номера будут кодом.'
      case 'flash':
        return 'Ожидайте «flash call» — код формируется из последних цифр звонка.'
      default:
        return 'Код отправлен через SMS. Введите его ниже.'
    }
  }, [authNextType])
  const handleResetAuth = () => {
    setAuthPhone('+7')
    setAuthApiId('')
    setAuthApiHash('')
    setAuthTransactionId(null)
    setAuthStep('phone')
    setAuthCode('')
    setAuthPassword('')
    setAuthResult(null)
    setAuthError(null)
    setCopyStatus('idle')
  }

  const handleStartAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!authPhone.trim()) {
      setAuthError('Введите номер телефона в международном формате')
      return
    }
    setAuthLoading(true)
    setAuthError(null)
    setAuthResult(null)
    setCopyStatus('idle')
    try {
      const apiIdNum = authApiId.trim() ? Number.parseInt(authApiId.trim(), 10) : undefined
      const apiHashStr = authApiHash.trim() || undefined
      const response = await telegramApi.startSession({
        phoneNumber: authPhone.trim(),
        apiId: apiIdNum && !Number.isNaN(apiIdNum) ? apiIdNum : undefined,
        apiHash: apiHashStr,
      })
      setAuthTransactionId(response.transactionId)
      setAuthCodeLength(response.codeLength)
      setAuthNextType(response.nextType)
      setAuthTimeoutSec(response.timeoutSec)
      setAuthStep('code')
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Не удалось отправить код, попробуйте позже')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleConfirmAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!authTransactionId) {
      setAuthError('Сессия не найдена. Повторите отправку кода.')
      return
    }
    if (!authCode.trim()) {
      setAuthError('Введите код подтверждения из Telegram')
      return
    }
    setAuthLoading(true)
    setAuthError(null)
    try {
      const response = await telegramApi.confirmSession({
        transactionId: authTransactionId,
        code: authCode.trim(),
        password: authPassword.trim() || undefined,
      })
      setAuthResult(response)
      setAuthStep('success')
      setCopyStatus('idle')
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Не удалось подтвердить код, попробуйте ещё раз')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleCopySession = async () => {
    if (!authResult?.session) {
      return
    }
    try {
      await navigator.clipboard.writeText(authResult.session)
      setCopyStatus('success')
    } catch {
      setCopyStatus('error')
    }
  }


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
        title="Создание StringSession"
        description="Сервис отправит код через Telegram и вернёт готовую строку для переменной окружения TELEGRAM_SESSION."
      >
        <div className="flex flex-col gap-6">
          {authStep === 'phone' && (
            <form onSubmit={handleStartAuth} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary" htmlFor="auth-phone">
                    Номер телефона
                  </label>
                  <Input
                    id="auth-phone"
                    value={authPhone}
                    onChange={(event) => setAuthPhone(event.target.value)}
                    placeholder="+79998887766"
                    disabled={authLoading}
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary" htmlFor="auth-api-id">
                    API ID
                  </label>
                  <Input
                    id="auth-api-id"
                    type="number"
                    value={authApiId}
                    onChange={(event) => setAuthApiId(event.target.value)}
                    placeholder="12345678"
                    disabled={authLoading}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary" htmlFor="auth-api-hash">
                    API Hash
                  </label>
                  <Input
                    id="auth-api-hash"
                    value={authApiHash}
                    onChange={(event) => setAuthApiHash(event.target.value)}
                    placeholder="abcdef1234567890abcdef1234567890"
                    disabled={authLoading}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background-primary/70 px-4 py-3 text-xs text-text-secondary">
                API ID и API Hash можно получить на{' '}
                <a
                  href="https://my.telegram.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  my.telegram.org
                </a>
                . Если не указаны, будут использованы значения из переменных окружения.
              </div>
              <Button type="submit" disabled={authLoading} className="sm:w-auto">
                {authLoading ? 'Отправляем код…' : 'Отправить код'}
              </Button>
            </form>
          )}

          {authStep === 'code' && (
            <form onSubmit={handleConfirmAuth} className="flex flex-col gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-secondary" htmlFor="auth-code">
                    Код подтверждения ({authCodeLength} символов)
                  </label>
                  <Input
                    id="auth-code"
                    value={authCode}
                    onChange={(event) => setAuthCode(event.target.value)}
                    placeholder="12345"
                    disabled={authLoading}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-secondary" htmlFor="auth-password">
                    Пароль 2FA (если установлен)
                  </label>
                  <Input
                    id="auth-password"
                    type="password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    placeholder="Пароль"
                    disabled={authLoading}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background-primary/70 px-4 py-3 text-sm text-text-secondary">
                {authHint}
                {authTimeoutSec ? ` Повторная отправка будет доступна через ~${authTimeoutSec} сек.` : ''}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={authLoading}>
                  {authLoading ? 'Подтверждаем…' : 'Получить сессию'}
                </Button>
                <Button type="button" variant="ghost" disabled={authLoading} onClick={handleResetAuth}>
                  Сбросить
                </Button>
              </div>
            </form>
          )}

          {authStep === 'success' && authResult && (
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">StringSession</label>
                <textarea
                  readOnly
                  className="min-h-[140px] w-full rounded-lg border border-border/60 bg-background-secondary px-3 py-2 text-sm text-text-primary"
                  value={authResult.session}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={handleCopySession}>
                  {copyStatus === 'success' ? 'Скопировано!' : copyStatus === 'error' ? 'Ошибка копирования' : 'Скопировать'}
                </Button>
                <Button type="button" variant="ghost" onClick={handleResetAuth}>
                  Создать новую сессию
                </Button>
              </div>
              <div className="rounded-lg border border-border/60 bg-background-primary/70 px-4 py-3 text-sm text-text-secondary">
                <p>
                  Пользователь: <span className="font-medium text-text-primary">{authResult.username ?? '—'}</span>
                </p>
                <p>
                  Телефон: <span className="font-medium text-text-primary">{authResult.phoneNumber ?? '—'}</span>
                </p>
                <p className="text-xs text-text-tertiary">
                  Скопируйте строку в переменную окружения <code className="rounded bg-border/50 px-1 py-0.5">TELEGRAM_SESSION</code>.
                </p>
              </div>
            </div>
          )}

          {authError && (
            <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {authError}
            </div>
          )}
        </div>
      </SectionCard>

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

