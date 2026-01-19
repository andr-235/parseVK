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
const sourceLabels: Record<string, string> = {
  messages: 'WhatsApp',
  messages_max: 'Max',
}
const resolveContentKind = (value?: string | null) => {
  const type = (value ?? '').toLowerCase()
  if (type.startsWith('image/') || type === 'image' || type === 'sticker') {
    return 'image'
  }
  if (type.startsWith('video/') || type === 'video') {
    return 'video'
  }
  if (type.startsWith('audio/') || type === 'audio') {
    return 'audio'
  }
  return 'link'
}

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

  const formatMetaValue = (value?: string | null) => {
    if (!value) return formatFallback
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : formatFallback
  }

  const formatSource = (value?: string | null) => {
    if (!value) return formatFallback
    const trimmed = value.trim()
    if (trimmed.length === 0) return formatFallback
    const tableName = trimmed.split('.').pop() ?? trimmed
    return sourceLabels[tableName] ?? tableName
  }

  const formatId = (value: string | number) => {
    if (value === null || value === undefined) return formatFallback
    return String(value)
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
            const hasText = Boolean(message.text && message.text.trim().length > 0)
            const contentUrl = message.contentUrl ?? null
            const contentKind = resolveContentKind(message.contentType)
            return (
              <div
                key={String(message.id)}
                className="rounded-lg border border-border/60 bg-muted/10 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>Источник: {formatSource(message.source)}</span>
                    <span>Чат: {formatMetaValue(message.chat)}</span>
                    <span>Отправитель: {formatMetaValue(message.author)}</span>
                    <span>ID: {formatId(message.id)}</span>
                  </div>
                  <span>{formatDate(message.createdAt)}</span>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {hasText ? message.text : !contentUrl ? 'Сообщение без текста' : null}
                </div>
                {contentUrl && (
                  <div className="mt-3">
                    {contentKind === 'image' && (
                      <a href={contentUrl} target="_blank" rel="noreferrer">
                        <img
                          src={contentUrl}
                          alt="Вложение"
                          loading="lazy"
                          className="max-h-72 w-auto rounded-lg border border-border/50"
                        />
                      </a>
                    )}
                    {contentKind === 'video' && (
                      <video
                        controls
                        preload="metadata"
                        className="w-full max-w-xl rounded-lg border border-border/50"
                      >
                        <source src={contentUrl} />
                      </video>
                    )}
                    {contentKind === 'audio' && (
                      <audio controls preload="metadata" className="w-full">
                        <source src={contentUrl} />
                      </audio>
                    )}
                    {contentKind === 'link' && (
                      <a
                        href={contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary underline"
                      >
                        Открыть вложение
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
      </CardContent>
    </Card>
  )
}
