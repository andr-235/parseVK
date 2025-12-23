import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TelegramSyncResponse } from '@/types/api'
import { Users, Download, Search, ArrowRight } from 'lucide-react'
import { useTelegramSync } from '@/modules/telegram/hooks/useTelegramSync'
import { getChatTypeInfo } from '@/modules/telegram/utils/telegramChatType.utils'

interface TelegramSyncCardProps {
  onDataLoaded: (data: TelegramSyncResponse) => void
}

export default function TelegramSyncCard({ onDataLoaded }: TelegramSyncCardProps) {
  const {
    identifier,
    setIdentifier,
    limit,
    setLimit,
    loading,
    lastSyncData,
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
        <CardDescription>Загрузка участников из чатов и каналов</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Лимит участников</label>
            <Input
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="1000"
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Загрузка...' : 'Синхронизировать'}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>

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
