import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Search,
  Hash,
  MessageSquare,
  Clock,
  Activity,
  Eye,
  Pause,
  Play,
  RefreshCw,
  MessageSquareDashed,
  AlertTriangle,
  LayoutList,
  LayoutGrid,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/common'
import { useIntersectionObserver } from '@/hooks/common/useIntersectionObserver'
import { highlightKeywords } from '@/utils/common/highlightKeywords'
import {
  MONITORING_TIME_RANGES,
  useMonitoringViewModel,
} from '@/hooks/monitoring/useMonitoringViewModel'
import { PageHeader } from '@/components/common'
import type { Keyword } from '@/types'
import type { IMonitorMessageResponse } from '@/types/common'

const PAGE_CARDS = [
  { icon: Activity, title: 'Мониторинг', subtitle: 'Отслеживание в реальном времени' },
  { icon: Search, title: 'Ключевые слова', subtitle: 'Автоматический поиск совпадений' },
  { icon: RefreshCw, title: 'Автообновление', subtitle: 'Периодическая синхронизация' },
  { icon: Eye, title: 'Live-просмотр', subtitle: 'Актуальные данные' },
]

const MONITORING_SOURCES = {
  whatsapp: {
    label: 'WhatsApp',
    sources: ['messages'],
  },
  max: {
    label: 'Max',
    sources: ['messages_max'],
  },
} as const

const sourceLabels: Record<string, string> = {
  messages: 'WhatsApp',
  messages_max: 'Max',
}

const sourceLogos: Record<string, { src: string; label: string }> = {
  whatsapp: { src: '/WhatsApp.svg', label: 'WhatsApp' },
  max: { src: '/Логотип_MAX.svg', label: 'Max' },
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

function MonitoringMessageSkeleton({ density }: { density: 'comfortable' | 'compact' }) {
  const isCompact = density === 'compact'
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/40 animate-pulse',
        isCompact ? 'p-3' : 'p-5'
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 rounded-full bg-slate-800" />
            <div className="h-5 w-24 rounded-full bg-slate-800" />
            <div className="h-4 w-32 rounded bg-slate-800" />
          </div>
          <div className="h-4 w-20 rounded bg-slate-800" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-800" />
          <div className="h-4 w-[90%] rounded bg-slate-800" />
          {!isCompact && <div className="h-4 w-[75%] rounded bg-slate-800" />}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ usedKeywords }: { usedKeywords: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-slate-900/20 py-12 px-6 text-center animate-in fade-in-0 duration-500">
      <div className="p-3 rounded-full bg-slate-800/40 text-slate-400 mb-4 border border-white/5 shadow-soft-sm">
        <MessageSquareDashed className="w-8 h-8" />
      </div>
      <h3 className="font-monitoring-display text-lg font-semibold text-white mb-2">
        Сообщений не найдено
      </h3>
      <p className="text-sm text-slate-400 max-w-md mb-4">
        {usedKeywords.length > 0
          ? 'Не обнаружено сообщений, содержащих активные ключевые слова за выбранный временной период. Попробуйте изменить параметры поиска или увеличить интервал времени.'
          : 'Для отображения ленты сообщений задайте ключевые слова в блоке поиска выше или измените период времени.'}
      </p>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 py-10 px-6 text-center animate-in fade-in-0 duration-500">
      <div className="p-3 rounded-full bg-destructive/10 text-destructive mb-4 border border-destructive/20 shadow-soft-sm">
        <AlertTriangle className="w-8 h-8 animate-pulse" />
      </div>
      <h3 className="font-monitoring-display text-lg font-semibold text-white mb-2">
        Не удалось загрузить сообщения
      </h3>
      <p className="text-sm text-slate-400 max-w-md mb-5">
        Произошла ошибка при получении данных с сервера:{' '}
        <span className="text-destructive/95 font-mono text-xs">{error}</span>
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          className="bg-linear-to-r from-red-500 to-amber-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Повторить попытку
        </Button>
      )}
    </div>
  )
}

interface MonitoringMessagesCardProps {
  messages: IMonitorMessageResponse[]
  isLoading: boolean
  isRefreshing: boolean
  isLoadingMore: boolean
  error: string | null
  hasMore: boolean
  onLoadMore: () => void
  usedKeywords: string[]
  onRefresh?: () => void
}

function MonitoringMessagesCard({
  messages,
  isLoading,
  isRefreshing,
  isLoadingMore,
  error,
  hasMore,
  onLoadMore,
  usedKeywords,
  onRefresh,
}: MonitoringMessagesCardProps) {
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({})
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const observerTargetRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  const hasMoreRef = useRef(hasMore)
  const isBusyRef = useRef(isLoading || isRefreshing || isLoadingMore)

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    []
  )

  const highlightKeywordEntries = useMemo<Keyword[]>(() => {
    const unique = Array.from(
      new Set(usedKeywords.map((value) => value.trim()).filter((value) => value.length > 0))
    )

    return unique.map((word, index) => ({
      id: index + 1,
      word,
      isPhrase: /\s/.test(word),
    }))
  }, [usedKeywords])

  const renderDateValue = (value: string | null) => {
    if (!value)
      return <span className="text-slate-500/70 italic text-[11px] font-normal">нет даты</span>
    const date = new Date(value)
    if (Number.isNaN(date.getTime()))
      return <span className="text-slate-500/70 italic text-[11px] font-normal">нет даты</span>
    return formatter.format(date)
  }

  const renderMetaValue = (value?: string | null) => {
    if (!value || value.trim().length === 0) {
      return <span className="text-slate-500/70 italic text-[11px] font-normal">не указан</span>
    }
    return value.trim()
  }

  const formatSource = (value?: string | null) => {
    if (!value || value.trim().length === 0) {
      return <span className="text-slate-500/70 italic text-[11px] font-normal">не указан</span>
    }
    const trimmed = value.trim()
    const tableName = trimmed.split('.').pop() ?? trimmed
    return sourceLabels[tableName] ?? tableName
  }

  const resolveSourceVisual = (value?: string | null) => {
    const rawLabel = formatSource(value)
    const label = typeof rawLabel === 'string' ? rawLabel : 'не указан'
    const key = label.toLowerCase()
    const logo = sourceLogos[key]
    return { label, logo }
  }

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
    hasMoreRef.current = hasMore
    isBusyRef.current = isLoading || isRefreshing || isLoadingMore
  }, [hasMore, isLoading, isLoadingMore, isRefreshing, onLoadMore])

  useIntersectionObserver(
    observerTargetRef,
    () => {
      if (hasMoreRef.current && !isBusyRef.current) {
        onLoadMoreRef.current()
      }
    },
    {
      enabled: hasMore && !isLoading && !isRefreshing && !isLoadingMore,
      threshold: 0.1,
      rootMargin: '200px',
    }
  )

  useEffect(() => {
    if (messages.length === 0) {
      setExpandedMessages({})
    }
  }, [messages.length])

  const toggleExpanded = (messageId: string) => {
    setExpandedMessages((current) => ({
      ...current,
      [messageId]: !current[messageId],
    }))
  }

  const isCompact = density === 'compact'

  return (
    <Card className="overflow-hidden border border-border/60 bg-slate-900/60 shadow-xl backdrop-blur-2xl">
      <CardHeader className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="font-monitoring-display text-lg text-white">
            Лента сообщений
          </CardTitle>
          <p className="text-xs text-muted-foreground font-monitoring-body">
            Живая подборка совпадений по активным ключам.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 border border-border/60 bg-slate-800/40 p-0.5 rounded-lg shadow-soft-sm">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDensity('comfortable')}
              className={cn(
                'h-7 w-7 rounded-md text-slate-400 hover:text-white transition-all duration-200',
                density === 'comfortable' && 'bg-slate-700/60 text-white shadow-soft-sm'
              )}
              title="Просторный вид"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDensity('compact')}
              className={cn(
                'h-7 w-7 rounded-md text-slate-400 hover:text-white transition-all duration-200',
                density === 'compact' && 'bg-slate-700/60 text-white shadow-soft-sm'
              )}
              title="Компактный вид"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Badge
            variant="outline"
            className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold shadow-soft-sm backdrop-blur"
          >
            Показано: {messages.length}
          </Badge>
          {isRefreshing && !isLoading && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground font-mono-accent">
              <span className="size-2 rounded-full bg-sky-400 motion-safe:animate-pulse" />
              Обновляем…
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn('p-6', isCompact ? 'space-y-3' : 'space-y-5')}>
        {isLoading && (
          <div className="space-y-4">
            <MonitoringMessageSkeleton density={density} />
            <MonitoringMessageSkeleton density={density} />
            <MonitoringMessageSkeleton density={density} />
          </div>
        )}
        {!isLoading && error && <ErrorState error={error} onRetry={onRefresh} />}
        {!isLoading && !error && messages.length === 0 && (
          <EmptyState usedKeywords={usedKeywords} />
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
            const sourceVisual = resolveSourceVisual(message.source)
            const messageId = String(message.id)
            const isExpanded = Boolean(expandedMessages[messageId])
            const shouldToggleText =
              hasText &&
              ((message.text?.length ?? 0) > 140 || (message.text?.includes('\n') ?? false))
            const shouldClampText = shouldToggleText && !isExpanded

            return (
              <div
                key={messageId}
                className={cn(
                  'group relative overflow-hidden rounded-xl border border-border/60 bg-slate-900/40 shadow-soft-sm transition duration-300 hover:border-primary/35 hover:-translate-y-0.5 hover:shadow-soft-md motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4',
                  isCompact ? 'p-3' : 'p-5'
                )}
                style={{ animationDelay: `${delay}ms` }}
              >
                <div className={cn('flex flex-col', isCompact ? 'gap-2' : 'gap-3.5')}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-full border-sky-500/35 bg-sky-500/10 px-2 py-0.5 font-semibold uppercase tracking-[0.15em] text-sky-700 dark:text-sky-200',
                          isCompact ? 'text-[9px]' : 'text-[10px]'
                        )}
                        title={sourceVisual.label}
                        aria-label={`Площадка: ${sourceVisual.label}`}
                      >
                        {sourceVisual.logo ? (
                          <img
                            src={sourceVisual.logo.src}
                            alt={sourceVisual.logo.label}
                            className={isCompact ? 'h-3.5 w-auto' : 'h-4 w-auto'}
                            loading="lazy"
                          />
                        ) : (
                          <span>{sourceVisual.label}</span>
                        )}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-full border-border/60 bg-slate-800/80 px-2.5 py-0.5 font-semibold uppercase tracking-[0.15em] text-text-primary shadow-soft-sm backdrop-blur',
                          isCompact ? 'text-[9px]' : 'text-[10px]'
                        )}
                      >
                        Чат: {renderMetaValue(message.chat)}
                      </Badge>
                      <span className={cn('font-medium', isCompact ? 'text-[11px]' : 'text-xs')}>
                        Автор: {renderMetaValue(message.author)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'font-mono-accent opacity-80',
                        isCompact ? 'text-[11px]' : 'text-xs'
                      )}
                    >
                      {renderDateValue(message.createdAt)}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'whitespace-pre-wrap leading-relaxed text-foreground/90 font-monitoring-body transition-all duration-200',
                      isCompact ? 'text-[13px]' : 'text-sm',
                      shouldClampText ? 'line-clamp-4' : ''
                    )}
                  >
                    {hasText ? (
                      highlightKeywords(
                        message.text ?? '',
                        highlightKeywordEntries,
                        'mx-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium font-mono-accent text-[12px] inline-block align-middle select-all'
                      )
                    ) : !contentUrl ? (
                      <span className="text-slate-500/70 italic text-xs">Сообщение без текста</span>
                    ) : null}
                  </div>
                  {shouldToggleText && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(messageId)}
                      className={cn(
                        'h-8 px-2 font-semibold uppercase tracking-[0.2em] text-text-primary hover:bg-slate-800/40',
                        isCompact ? 'text-[9px]' : 'text-[10px]'
                      )}
                    >
                      {isExpanded ? 'Свернуть текст' : 'Развернуть текст'}
                    </Button>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {contentUrl && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-full px-3 py-1 font-semibold uppercase tracking-[0.18em]',
                          contentBadgeStyle,
                          isCompact ? 'text-[9px]' : 'text-[10px]'
                        )}
                      >
                        {contentLabel}
                      </Badge>
                    )}
                  </div>

                  {contentUrl && (
                    <div
                      className={cn(
                        'rounded-xl border border-border/50 bg-background/60',
                        isCompact ? 'p-2' : 'p-3'
                      )}
                    >
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
        {!isLoading && !error && messages.length > 0 && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <div ref={observerTargetRef} className="h-1 w-full" />
            {hasMore ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="h-10 rounded-full border-border/60 bg-background/70 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary shadow-soft-sm backdrop-blur transition hover:bg-background/90"
              >
                {isLoadingMore ? 'Загружаем…' : 'Показать ещё'}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground font-monitoring-body">
                Это все найденные сообщения
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MonitoringPage() {
  const { sourceKey } = useParams()
  const normalizedSourceKey = sourceKey?.toLowerCase()
  const activeSource =
    normalizedSourceKey === 'max' ? MONITORING_SOURCES.max : MONITORING_SOURCES.whatsapp
  const [isKeywordsExpanded, setIsKeywordsExpanded] = useState(false)
  const keywordsPreviewCount = 8
  const activeSources = useMemo(() => [...activeSource.sources], [activeSource.sources])

  const {
    messages,
    searchInput,
    setSearchInput,
    usedKeywords,
    timeRange,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    autoRefresh,
    page,
    hasMore,
    lastUpdatedAt,
    stats,
    applyManualSearch,
    clearManualSearch,
    toggleAutoRefresh,
    changeTimeRange,
    loadMore,
    refreshNow,
  } = useMonitoringViewModel({ sources: activeSources })

  const isAutoRefreshActive = autoRefresh && page === 1
  const autoRefreshLabel = autoRefresh
    ? page > 1
      ? 'Автообновление приостановлено'
      : 'Автообновление включено'
    : 'Автообновление выключено'

  const lastUpdatedLabel = useMemo<React.ReactNode>(() => {
    if (!lastUpdatedAt) {
      return <span className="text-slate-500/70 italic text-sm font-normal">не обновлялось</span>
    }
    const date = new Date(lastUpdatedAt)
    if (Number.isNaN(date.getTime())) {
      return <span className="text-slate-500/70 italic text-sm font-normal">не обновлялось</span>
    }
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  }, [lastUpdatedAt])

  const visibleKeywords = isKeywordsExpanded
    ? usedKeywords
    : usedKeywords.slice(0, keywordsPreviewCount)
  const hiddenKeywordsCount = Math.max(usedKeywords.length - visibleKeywords.length, 0)

  return (
    <div className="flex flex-col gap-10 max-w-400 mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      {/* Hero Section - fade in first */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <PageHeader
            variant="grid"
            title={
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
                  Мониторинг <span className="text-accent-primary">{activeSource.label}</span>
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    'uppercase text-[10px] tracking-wider font-semibold rounded-full font-mono-accent',
                    isAutoRefreshActive
                      ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                      : autoRefresh
                        ? 'border border-amber-500/25 bg-amber-500/10 text-amber-400'
                        : 'border border-border/60 bg-background/50 text-slate-400'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block w-1.5 h-1.5 rounded-full mr-1.5',
                      isAutoRefreshActive
                        ? 'bg-emerald-400 animate-pulse'
                        : autoRefresh
                          ? 'bg-amber-400'
                          : 'bg-slate-400'
                    )}
                  />
                  {autoRefreshLabel}
                </Badge>
              </div>
            }
            description={`Автоматический поиск сообщений по ключевым словам в подключённой базе ${activeSource.label}. Мгновенное отслеживание новых совпадений с настраиваемым интервалом обновления.`}
            actions={
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={refreshNow}
                  size="sm"
                  variant="outline"
                  className="h-10 border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-primary/50 transition-all duration-200"
                  disabled={isLoading || isRefreshing}
                >
                  <RefreshCw className={cn('mr-2 w-4 h-4', isRefreshing && 'animate-spin')} />
                  Обновить
                </Button>
                <Button
                  onClick={toggleAutoRefresh}
                  size="sm"
                  className={cn(
                    'h-10 transition-all duration-200',
                    autoRefresh
                      ? 'bg-linear-to-r from-emerald-500 to-primary text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40'
                      : 'border border-border/60 bg-background-secondary text-white hover:bg-white/5'
                  )}
                >
                  {autoRefresh ? (
                    <>
                      <Pause className="mr-2 w-4 h-4" />
                      Остановить
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 w-4 h-4" />
                      Запустить
                    </>
                  )}
                </Button>
              </div>
            }
            cards={PAGE_CARDS}
          />
        </div>
      </div>

      {/* Search Section - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Поиск по ключевым словам
          </h2>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <Card className="border border-white/10 bg-[#131316]/90 backdrop-blur-2xl p-6 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Ручной поиск
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      applyManualSearch()
                    }
                  }}
                  placeholder="Ключевые слова через запятую или новую строку"
                  className="h-11 border-[#2a2a30] bg-[#1c1c21] pl-11 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <p className="text-xs text-slate-500">Подсказка: нажмите Enter для применения</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button
                onClick={applyManualSearch}
                className="h-11 bg-linear-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
              >
                Применить
              </Button>
              <Button
                variant="outline"
                onClick={clearManualSearch}
                className="h-11 border-[#2a2a30] bg-[#1c1c21] text-white hover:bg-white/5 transition-all duration-200"
              >
                Сброс
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Section - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">Период</h2>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <div className="flex flex-wrap gap-2">
          {MONITORING_TIME_RANGES.map((option) => {
            const isActive = timeRange === option.value
            return (
              <Button
                key={option.value}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => changeTimeRange(option.value)}
                className={cn(
                  'h-10 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200',
                  isActive
                    ? 'bg-linear-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/25'
                    : 'border-[#2a2a30] bg-[#1c1c21] text-white hover:bg-white/5'
                )}
              >
                {option.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Statistics Section - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">Статистика</h2>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              glowClass: 'from-primary/20 to-orange-500/20',
              borderClass: 'via-primary/50',
              icon: MessageSquare,
              iconClass: 'bg-primary/10 text-primary',
              label: 'Сообщений',
              value: stats.total,
            },
            {
              glowClass: 'from-orange-500/20 to-zinc-800/10',
              borderClass: 'via-orange-400/50',
              icon: Hash,
              iconClass: 'bg-orange-500/10 text-orange-400',
              label: 'Ключей',
              value: stats.usedKeywordsCount,
            },
            {
              className: 'sm:col-span-2 lg:col-span-1',
              glowClass: 'from-zinc-800/10 to-primary/20',
              borderClass: 'via-purple-400/50',
              icon: Clock,
              iconClass: 'bg-purple-500/10 text-purple-400',
              label: 'Обновлено',
              value: lastUpdatedLabel,
              valueClass: 'text-lg font-semibold',
            },
          ].map((card, index) => {
            const Icon = card.icon
            return (
              <div key={index} className={cn('relative', card.className)}>
                <div
                  className={cn(
                    'absolute -inset-0.5 rounded-xl opacity-50 blur-lg bg-linear-to-r',
                    card.glowClass
                  )}
                />
                <Card className="relative border border-white/10 bg-[#131316]/90 backdrop-blur-2xl p-5 overflow-hidden">
                  <div
                    className={cn(
                      'absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent',
                      card.borderClass
                    )}
                  />
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg', card.iconClass)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                        {card.label}
                      </p>
                      <p
                        className={cn(
                          'font-monitoring-display text-white',
                          card.valueClass || 'text-3xl font-bold'
                        )}
                      >
                        {card.value}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Keywords Section - staggered animation */}
      {usedKeywords.length > 0 && (
        <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-400">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="font-monitoring-display text-2xl font-semibold text-white">
                Активные ключи
              </h2>
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-primary/50 to-transparent" />
            </div>
            <Badge
              variant="outline"
              className="border-white/10 bg-slate-900/50 px-3 py-1 text-xs text-slate-400 font-mono-accent"
            >
              {usedKeywords.length} активны
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {visibleKeywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="outline"
                  className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
            {hiddenKeywordsCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsKeywordsExpanded((value) => !value)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                {isKeywordsExpanded ? 'Свернуть список' : `Показать ещё ${hiddenKeywordsCount}`}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Messages Section - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-500">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">Сообщения</h2>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <MonitoringMessagesCard
          messages={messages}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          isLoadingMore={isLoadingMore}
          error={error}
          hasMore={hasMore}
          onLoadMore={loadMore}
          usedKeywords={usedKeywords}
          onRefresh={refreshNow}
        />
      </div>
    </div>
  )
}

export default MonitoringPage
