import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
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
const contentKindLabels: Record<string, string> = {
  image: 'Изображение',
  video: 'Видео',
  audio: 'Аудио',
  link: 'Вложение',
}
const contentKindBadgeStyles: Record<string, string> = {
  image: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  video: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200',
  audio: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200',
  link: 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-200',
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
      <CardHeader className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="font-monitoring-display text-lg">Лента сообщений</CardTitle>
          <p className="text-xs text-muted-foreground">
            Живая подборка совпадений по активным ключам.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold shadow-soft-sm backdrop-blur"
          >
            Всего: {messages.length}
          </Badge>
          {isRefreshing && !isLoading && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-sky-400 motion-safe:animate-pulse" />
              Обновляем…
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {isLoading && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-6 text-sm text-muted-foreground">
            Загрузка сообщений…
          </div>
        )}
        {!isLoading && error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            Ошибка: {error}
          </div>
        )}
        {!isLoading && !error && messages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-6 text-sm text-muted-foreground">
            Сообщений не найдено
          </div>
        )}
        {!isLoading &&
          !error &&
          messages.map((message, index) => {
            const hasText = Boolean(message.text && message.text.trim().length > 0)
            const contentUrl = message.contentUrl ?? null
            const contentKind = resolveContentKind(message.contentType)
            const contentLabel = contentKindLabels[contentKind] ?? contentKindLabels.link
            const contentBadgeStyle =
              contentKindBadgeStyles[contentKind] ?? contentKindBadgeStyles.link
            const delay = Math.min(index, 6) * 80

            return (
              <div
                key={String(message.id)}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-background/70 p-4 shadow-soft-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-soft-md motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4"
                style={{ animationDelay: `${delay}ms` }}
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-400/70 via-emerald-400/50 to-amber-300/60 opacity-80" />
                <div className="flex flex-col gap-3 pl-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-full border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-200"
                      >
                        Источник: {formatSource(message.source)}
                      </Badge>
                      <span>Чат: {formatMetaValue(message.chat)}</span>
                      <span>Автор: {formatMetaValue(message.author)}</span>
                    </div>
                    <span>{formatDate(message.createdAt)}</span>
                  </div>

                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {hasText ? message.text : !contentUrl ? 'Сообщение без текста' : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="uppercase tracking-[0.2em]">ID {formatId(message.id)}</span>
                    {contentUrl && (
                      <Badge
                        variant="outline"
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${contentBadgeStyle}`}
                      >
                        {contentLabel}
                      </Badge>
                    )}
                  </div>

                  {contentUrl && (
                    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                      {contentKind === 'image' && (
                        <a href={contentUrl} target="_blank" rel="noreferrer">
                          <img
                            src={contentUrl}
                            alt="Вложение"
                            loading="lazy"
                            className="max-h-72 w-auto rounded-xl border border-border/50 shadow-soft-sm"
                          />
                        </a>
                      )}
                      {contentKind === 'video' && (
                        <video
                          controls
                          preload="metadata"
                          className="w-full max-w-xl rounded-xl border border-border/50 shadow-soft-sm"
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
                          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary transition hover:bg-background"
                        >
                          Открыть вложение
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
      </CardContent>
    </Card>
  )
}
