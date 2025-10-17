import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import PageHeroCard from '@/components/PageHeroCard'
import SectionCard from '@/components/SectionCard'
import { SuspicionLevelBadge } from '@/components/SuspicionLevelBadge'
import { PhotoAnalysisCard } from '@/components/PhotoAnalysisCard'
import { authorsService } from '@/services/authorsService'
import { usePhotoAnalysisStore, useAuthorsStore } from '@/stores'
import type { AuthorDetails, PhotoAnalysisSummary } from '@/types'
import { createEmptyPhotoAnalysisSummary } from '@/types'

const categoryLabels: Record<string, string> = {
  violence: 'Насилие',
  drugs: 'Наркотики',
  weapons: 'Оружие',
  nsfw: 'NSFW',
  extremism: 'Экстремизм',
  'hate speech': 'Разжигание ненависти',
}

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return 'Нет данных'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Нет данных'
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AuthorAnalysis() {
  const params = useParams<{ vkUserId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const vkUserId = Number(params.vkUserId)
  const isValidAuthor = Number.isInteger(vkUserId) && vkUserId > 0

  const [author, setAuthor] = useState<AuthorDetails | null>(null)
  const [isAuthorLoading, setIsAuthorLoading] = useState(false)

  const locationState = location.state as
    | {
        author?: {
          vkUserId: number
          firstName?: string
          lastName?: string
          fullName?: string
          avatar?: string | null
          profileUrl?: string | null
          screenName?: string | null
          domain?: string | null
        }
        summary?: PhotoAnalysisSummary
      }
    | null

  const analyses = usePhotoAnalysisStore((state) => state.analyses)
  const summary = usePhotoAnalysisStore((state) => state.summary)
  const isLoading = usePhotoAnalysisStore((state) => state.isLoading)
  const isAnalyzing = usePhotoAnalysisStore((state) => state.isAnalyzing)
  const filter = usePhotoAnalysisStore((state) => state.filter)
  const analyzeAuthor = usePhotoAnalysisStore((state) => state.analyzeAuthor)
  const fetchResults = usePhotoAnalysisStore((state) => state.fetchResults)
  const fetchSuspicious = usePhotoAnalysisStore((state) => state.fetchSuspicious)
  const deleteResults = usePhotoAnalysisStore((state) => state.deleteResults)
  const setFilter = usePhotoAnalysisStore((state) => state.setFilter)
  const clear = usePhotoAnalysisStore((state) => state.clear)
  const markAuthorVerified = useAuthorsStore((state) => state.markAuthorVerified)

  useEffect(() => {
    if (!locationState?.author || author) {
      return
    }

    const { author: stateAuthor, summary } = locationState

    setAuthor({
      id: 0,
      vkUserId: stateAuthor.vkUserId,
      firstName: stateAuthor.firstName ?? '',
      lastName: stateAuthor.lastName ?? '',
      fullName: stateAuthor.fullName ?? `id${stateAuthor.vkUserId}`,
      photo50: stateAuthor.avatar ?? null,
      photo100: stateAuthor.avatar ?? null,
      photo200: stateAuthor.avatar ?? null,
      domain: stateAuthor.domain ?? null,
      screenName: stateAuthor.screenName ?? null,
      profileUrl: stateAuthor.profileUrl ?? null,
      summary: summary ?? createEmptyPhotoAnalysisSummary(),
      photosCount: null,
      audiosCount: null,
      videosCount: null,
      friendsCount: null,
      followersCount: null,
      lastSeenAt: null,
      verifiedAt: null,
      isVerified: false,
      city: null,
      country: null,
      createdAt: '',
      updatedAt: '',
    })
  }, [author, locationState])

  useEffect(() => {
    if (!isValidAuthor) {
      toast.error('Некорректный идентификатор пользователя')
      navigate('/watchlist', { replace: true })
      return
    }

    setIsAuthorLoading(true)
    authorsService
      .getAuthorDetails(vkUserId)
      .then((details) => {
        setAuthor(details)
      })
      .catch(() => {
        toast.error('Не удалось загрузить данные пользователя')
        navigate('/watchlist', { replace: true })
      })
      .finally(() => {
        setIsAuthorLoading(false)
      })
  }, [isValidAuthor, navigate, vkUserId])

  useEffect(() => {
    if (!isValidAuthor) {
      return
    }

    const load = async () => {
      try {
        if (filter === 'suspicious') {
          await fetchSuspicious(vkUserId)
        } else {
          await fetchResults(vkUserId)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось загрузить результаты анализа'
        toast.error(message)
      }
    }

    void load()
  }, [fetchResults, fetchSuspicious, filter, isValidAuthor, vkUserId])

  useEffect(() => () => {
    clear()
  }, [clear])

  useEffect(() => {
    if (!author?.vkUserId || !author.verifiedAt) {
      return
    }

    markAuthorVerified(author.vkUserId, author.verifiedAt)
  }, [author?.vkUserId, author?.verifiedAt, markAuthorVerified])

  const heroFooter = useMemo(() => {
    if (!summary) {
      return null
    }

    const lastAnalyzed = formatDateTime(summary.lastAnalyzedAt)
    const verifiedAt = formatDateTime(author?.verifiedAt)
    const lastSeen = formatDateTime(author?.lastSeenAt)

    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-accent-primary/30 bg-accent-primary/10 text-accent-primary">
          Фото: {summary.total}
        </Badge>
        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
          Подозрительных: {summary.suspicious}
        </Badge>
        <Badge variant="outline" className="border-border/50">
          Последний анализ: {lastAnalyzed}
        </Badge>
        <Badge variant="outline" className="border-border/50">
          Последний вход: {lastSeen}
        </Badge>
        <Badge variant="outline" className="border-border/50">
          Проверен: {verifiedAt}
        </Badge>
      </div>
    )
  }, [author?.lastSeenAt, author?.verifiedAt, summary])

  const handleAnalyze = async (force = false) => {
    if (!isValidAuthor) {
      return
    }

    try {
      await analyzeAuthor(vkUserId, { limit: 50, force })
      toast.success(force ? 'Повторный анализ завершён' : 'Анализ фотографий выполнен')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось проанализировать фотографии'
      toast.error(message)
    }
  }

  const handleDelete = async () => {
    if (!isValidAuthor) {
      return
    }

    try {
      await deleteResults(vkUserId)
      toast.success('Результаты анализа удалены')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось удалить результаты анализа'
      toast.error(message)
    }
  }

  const handleFilterChange = (nextFilter: 'all' | 'suspicious') => {
    if (filter === nextFilter || !isValidAuthor) {
      return
    }

    setFilter(nextFilter)
  }

  const categories = useMemo(() => summary?.categories ?? [], [summary?.categories])

  return (
    <div className="flex flex-col gap-8">
      <PageHeroCard
        title={author ? author.fullName : 'Анализ фотографий'}
        description={
          author
            ? `Профиль VK ID ${author.vkUserId}. Следите за подозрительным контентом и запускайте анализ фотографий.`
            : 'Загружаем данные автора...'
        }
        footer={heroFooter}
        actions={
          <div className="flex flex-col gap-2 md:flex-row">
            <Button onClick={() => handleAnalyze(false)} disabled={!isValidAuthor || isAnalyzing}>
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Анализируем…
                </span>
              ) : (
                'Анализировать фото'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAnalyze(true)}
              disabled={!isValidAuthor || isAnalyzing}
            >
              Повторить анализ
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!isValidAuthor || isAnalyzing}>
              Очистить результаты
            </Button>
          </div>
        }
      />

      <SectionCard
        title="Сводка анализа"
        description="Основные категории и уровни подозрительного контента по фотографиям автора."
      >
        {isAuthorLoading ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-6 w-6" />
          </div>
        ) : null}

        {author ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Основные тематики</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const label = categoryLabels[category.name.toLowerCase()] ?? category.name
                    const hasFindings = category.count > 0
                    return (
                      <Badge
                        key={category.name}
                        variant={hasFindings ? 'outline' : 'secondary'}
                        className="text-xs"
                      >
                        {label} · {category.count}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              {author.profileUrl ? (
                <a
                  href={author.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-2 text-sm text-accent-primary hover:underline"
                >
                  Открыть профиль VK
                </a>
              ) : null}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/50 bg-background-primary/40 p-4">
              <p className="text-sm font-medium text-text-primary">Распределение по уровням</p>
              <div className="space-y-2">
                {summary?.levels.map((level) => (
                  <div key={level.level} className="flex items-center justify-between gap-3">
                    <SuspicionLevelBadge level={level.level} />
                    <span className="text-sm text-text-secondary">{level.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Фотографии"
        description="Результаты анализа каждого изображения."
        headerActions={
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('all')}
            >
              Все
            </Button>
            <Button
              variant={filter === 'suspicious' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('suspicious')}
            >
              Подозрительные
            </Button>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : null}

        {!isLoading && analyses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background-primary/40 px-6 py-12 text-center text-text-secondary">
            <p className="text-lg font-medium text-text-primary">
              {filter === 'suspicious' ? 'Подозрительные фото не найдены' : 'Результаты анализа отсутствуют'}
            </p>
            <p className="max-w-md text-sm">
              {filter === 'suspicious'
                ? 'Попробуйте просмотреть все фото или повторно выполнить анализ.'
                : 'Запустите анализ фотографий, чтобы увидеть результаты.'}
            </p>
          </div>
        ) : null}

        {analyses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {analyses.map((analysis) => (
              <PhotoAnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default AuthorAnalysis
