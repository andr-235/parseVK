import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import type { TelegramSyncResult } from '@/shared/types'
import { Users, Download, Search, ArrowRight } from 'lucide-react'
import { useTelegramSync } from '@/modules/telegram/hooks/useTelegramSync'
import { getChatTypeInfo } from '@/modules/telegram/utils/telegramChatType.utils'

interface TelegramSyncCardProps {
  onDataLoaded: (data: TelegramSyncResult) => void
}

export default function TelegramSyncCard({ onDataLoaded }: TelegramSyncCardProps) {
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
