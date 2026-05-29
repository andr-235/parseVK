import { useState, useMemo } from 'react'
import type { TelegramSyncResult, TelegramMember } from '@/types/common'
import { PageHeader } from '@/components/common'
import {
  Send,
  Users,
  Link,
  MessageSquare,
  Shield,
  User,
  Copy,
  LogOut,
  RefreshCw,
  Download,
  Search,
  ArrowRight,
  CheckCircle2,
  UserX,
  Ban,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTelegramSession } from '@/pages/telegram/hooks/useTelegramSession'
import { useTelegramSync } from '@/pages/telegram/hooks/useTelegramSync'
import { getChatTypeInfo } from '@/pages/telegram/utils/telegramChatType.utils'

export function TelegramSessionCard() {
  const {
    authStep,
    authCode,
    setAuthCode,
    authPassword,
    setAuthPassword,
    authLoading,
    authError,
    authHint,
    authResult,
    handleStartNewSession,
    handleResetAuth,
    handleConfirmAuth,
    handleCopySession,
  } = useTelegramSession()

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Сессия</CardTitle>
        </div>
        <CardDescription>Статус подключения к Telegram</CardDescription>
      </CardHeader>
      <CardContent>
        {authStep === 'code' && (
          <form onSubmit={handleConfirmAuth} className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Код подтверждения
              </label>
              <Input
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Введите код"
                disabled={authLoading}
              />
              <p className="text-xs text-muted-foreground">{authHint}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Пароль (2FA)</label>
              <Input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Если установлен"
                disabled={authLoading}
              />
            </div>

            {authError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {authError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={authLoading} className="flex-1">
                {authLoading ? 'Проверка...' : 'Подтвердить'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetAuth}
                disabled={authLoading}
              >
                Отмена
              </Button>
            </div>
          </form>
        )}

        {authStep === 'success' && authResult && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{authResult.username || 'Без имени'}</p>
                    <p className="text-xs text-muted-foreground">{authResult.phoneNumber}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                >
                  Активно
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleCopySession}
              >
                <Copy className="mr-2 h-4 w-4" />
                Скопировать StringSession
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={handleStartNewSession}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Пересоздать сессию
              </Button>
            </div>
          </div>
        )}

        {authStep === 'success' && !authResult && (
          <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <LogOut className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Нет активной сессии</p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Создайте новую сессию для работы с Telegram API
              </p>
            </div>
            <Button onClick={handleStartNewSession} disabled={authLoading}>
              {authLoading ? 'Загрузка...' : 'Создать сессию'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TelegramSyncCardProps {
  onDataLoaded: (data: TelegramSyncResult) => void
}

export function TelegramSyncCard({ onDataLoaded }: TelegramSyncCardProps) {
  const {
    identifier,
    setIdentifier,
    syncMode,
    setSyncMode,
    discussionMode,
    setDiscussionMode,
    limit,
    setLimit,
    messageId,
    setMessageId,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    messageLimit,
    setMessageLimit,
    authorLimit,
    setAuthorLimit,
    loading,
    lastSyncData,
    errorMessage,
    handleSubmit,
    handleExport,
  } = useTelegramSync(onDataLoaded)

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Синхронизация</CardTitle>
        </div>
        <CardDescription>
          Загрузка участников чатов или авторов комментариев из обсуждений
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Режим</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={syncMode === 'members' ? 'default' : 'outline'}
                onClick={() => setSyncMode('members')}
                disabled={loading}
              >
                Участники
              </Button>
              <Button
                type="button"
                variant={syncMode === 'commentAuthors' ? 'default' : 'outline'}
                onClick={() => setSyncMode('commentAuthors')}
                disabled={loading}
              >
                Комментаторы обсуждения
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Идентификатор (username или ID)
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="@channel или ID"
                className="pl-9"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {syncMode === 'members'
                ? 'Для первого импорта используйте @username, публичную или invite-ссылку. Внутренние ID и t.me/c/... работают для уже известных чатов.'
                : 'Для одного треда можно вставить t.me/c/... ссылку на сообщение. Если чат известен системе, можно использовать и внутренний ID.'}
            </p>
          </div>

          {syncMode === 'members' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Лимит участников</label>
              <Input
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="1000"
                disabled={loading}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Режим обсуждения</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={discussionMode === 'thread' ? 'default' : 'outline'}
                    onClick={() => setDiscussionMode('thread')}
                    disabled={loading}
                  >
                    Один тред
                  </Button>
                  <Button
                    type="button"
                    variant={discussionMode === 'chatRange' ? 'default' : 'outline'}
                    onClick={() => setDiscussionMode('chatRange')}
                    disabled={loading}
                  >
                    Диапазон сообщений
                  </Button>
                </div>
              </div>

              {discussionMode === 'thread' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Message ID, если его нет в ссылке
                  </label>
                  <Input
                    value={messageId}
                    onChange={(e) => setMessageId(e.target.value)}
                    placeholder="115914"
                    disabled={loading}
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Дата от</label>
                      <Input
                        type="datetime-local"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Дата до</label>
                      <Input
                        type="datetime-local"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Лимит сообщений</label>
                      <Input
                        value={messageLimit}
                        onChange={(e) => setMessageLimit(e.target.value)}
                        placeholder="200"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Лимит авторов</label>
                      <Input
                        value={authorLimit}
                        onChange={(e) => setAuthorLimit(e.target.value)}
                        placeholder="1000"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? 'Загрузка...'
              : syncMode === 'members'
                ? 'Синхронизировать'
                : 'Собрать комментаторов'}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        {errorMessage && (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {lastSyncData && (
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase">Чат</p>
                <p className="font-medium truncate" title={lastSyncData.title || ''}>
                  {lastSyncData.title || 'Без названия'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase mb-1.5">Тип источника</p>
                {(() => {
                  const typeInfo = getChatTypeInfo(lastSyncData.type)
                  const Icon = typeInfo.icon
                  return (
                    <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                      <Icon className={`h-3.5 w-3.5 ${typeInfo.color}`} />
                      <span>{typeInfo.label}</span>
                    </Badge>
                  )
                })()}
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Всего</p>
                <p className="font-medium">{lastSyncData.totalMembers ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Загружено</p>
                <p className="font-medium text-primary">{lastSyncData.syncedMembers}</p>
              </div>
              {'source' in lastSyncData && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Сообщений просмотрено</p>
                  <p className="font-medium">{lastSyncData.fetchedMessages}</p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт в Excel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TelegramMembersCardProps {
  data: TelegramSyncResult | null
}

export function TelegramMembersCard({ data }: TelegramMembersCardProps) {
  const members = useMemo(() => data?.members ?? [], [data?.members])

  const formatMemberName = (member: TelegramMember) => {
    const parts = [member.firstName, member.lastName].filter((value) =>
      Boolean(value && value.trim().length > 0)
    )
    if (parts.length > 0) {
      return parts.join(' ')
    }
    if (member.username) {
      return `@${member.username}`
    }
    return member.telegramId
  }

  const formatDate = (value: string | null) => {
    if (!value) return '—'
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

  const typeInfo = useMemo(() => {
    if (!data?.type) return null
    return getChatTypeInfo(data.type)
  }, [data?.type])
  const isDiscussionAuthors = data && 'source' in data && data.source === 'discussion_comments'

  if (!data) {
    return (
      <Card className="h-full border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
          <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="font-medium text-lg text-muted-foreground">Нет данных</h3>
          <p className="text-sm text-muted-foreground/60 max-w-xs">
            Выполните синхронизацию, чтобы увидеть участников или авторов комментариев
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle>{isDiscussionAuthors ? 'Авторы комментариев' : 'Участники'}</CardTitle>
              {typeInfo && (
                <Badge variant="outline" className="flex items-center gap-1.5">
                  {(() => {
                    const Icon = typeInfo.icon
                    return <Icon className={`h-3.5 w-3.5 ${typeInfo.color}`} />
                  })()}
                  <span>{typeInfo.label}</span>
                </Badge>
              )}
            </div>
            <CardDescription>
              Найдено {members.length} {isDiscussionAuthors ? 'авторов' : 'участников'}
              {data?.title && ` • ${data.title}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Участник</TableHead>
                <TableHead className="w-[150px]">Статус</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Флаги</TableHead>
                <TableHead className="w-[150px]">Активность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {isDiscussionAuthors
                      ? 'Авторы комментариев не найдены'
                      : 'Участники не найдены'}
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const flags = []
                  if (member.verified)
                    flags.push({
                      icon: <CheckCircle2 className="h-3 w-3" />,
                      title: 'Верифицирован',
                      variant: 'default' as const,
                    })
                  if (member.scam)
                    flags.push({
                      icon: <Shield className="h-3 w-3" />,
                      title: 'Scam',
                      variant: 'destructive' as const,
                    })
                  if (member.fake)
                    flags.push({
                      icon: <UserX className="h-3 w-3" />,
                      title: 'Fake',
                      variant: 'outline' as const,
                    })
                  if (member.deleted)
                    flags.push({
                      icon: <Ban className="h-3 w-3" />,
                      title: 'Удален',
                      variant: 'secondary' as const,
                    })
                  if (member.isPremium)
                    flags.push({
                      icon: <Star className="h-3 w-3" />,
                      title: 'Premium',
                      variant: 'default' as const,
                    })

                  return (
                    <TableRow key={`${member.userId}-${member.telegramId}`}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{formatMemberName(member)}</span>
                          <span className="text-xs text-muted-foreground">
                            ID: {member.telegramId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant={statusVariant(member.status)} className="text-xs">
                            {formatStatus(member.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          {member.username ? (
                            <span className="text-primary hover:underline cursor-pointer">
                              @{member.username}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {member.phoneNumber && (
                            <span className="text-xs text-muted-foreground">
                              {member.phoneNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {flags.map((flag, i) => (
                            <Badge
                              key={i}
                              variant={flag.variant}
                              className="h-5 w-5 p-0 flex items-center justify-center rounded-full"
                              title={flag.title}
                            >
                              {flag.icon}
                            </Badge>
                          ))}
                          {flags.length === 0 && (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <span>Вход: {formatDate(member.joinedAt)}</span>
                          {member.leftAt && <span>Выход: {formatDate(member.leftAt)}</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function TelegramPage() {
  const [data, setData] = useState<TelegramSyncResult | null>(null)

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          title={
            <>
              Telegram <span className="text-accent-info">интеграция</span>
            </>
          }
          description="Управление сессиями Telegram API для автоматической синхронизации участников чатов и групп. Получайте актуальные данные о членах сообществ."
          cards={[
            { icon: Link, title: 'Сессии', subtitle: 'Управление подключениями к API' },
            { icon: Send, title: 'Синхронизация', subtitle: 'Загрузка участников чатов' },
            { icon: Users, title: 'Участники', subtitle: 'База членов сообществ' },
            { icon: MessageSquare, title: 'Чаты', subtitle: 'Группы и каналы' },
          ]}
        />
      </div>

      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Управление подключением
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <TelegramSessionCard />
          <TelegramSyncCard onDataLoaded={setData} />
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Результат синхронизации
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <TelegramMembersCard data={data} />
      </div>
    </div>
  )
}

export default TelegramPage
