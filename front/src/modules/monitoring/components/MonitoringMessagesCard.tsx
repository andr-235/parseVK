import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { IMonitorMessageResponse } from '@/types/api'

interface MonitoringMessagesCardProps {
  messages: IMonitorMessageResponse[]
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
}

const formatFallback = '—'

export function MonitoringMessagesCard({
  messages,
  isLoading,
  isRefreshing,
  error,
}: MonitoringMessagesCardProps) {
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    []
  )

  const formatDate = (value: string | null) => {
    if (!value) return formatFallback
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return formatFallback
    return formatter.format(date)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Сообщения</CardTitle>
        {isRefreshing && !isLoading && (
          <span className="text-xs text-muted-foreground">Обновляем…</span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <div className="text-sm text-muted-foreground">Загрузка сообщений…</div>}
        {!isLoading && error && <div className="text-sm text-destructive">Ошибка: {error}</div>}
        {!isLoading && !error && messages.length === 0 && (
          <div className="text-sm text-muted-foreground">Сообщений не найдено</div>
        )}
        {!isLoading &&
          !error &&
          messages.map((message) => {
            const meta = [message.chat, message.author].filter(Boolean).join(' • ')
            return (
              <div
                key={String(message.id)}
                className="rounded-lg border border-border/60 bg-muted/10 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{meta || 'Источник не указан'}</span>
                  <span>{formatDate(message.createdAt)}</span>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {message.text || 'Сообщение без текста'}
                </div>
              </div>
            )
          })}
      </CardContent>
    </Card>
  )
}
